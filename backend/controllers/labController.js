const pool = require("../config/database")

const formatDate = (value) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().split("T")[0]
}

const formatStatus = (status) => {
  if (!status) return "Pending"
  const normalized = status.toString().toLowerCase()
  if (normalized === "in-progress") return "In Progress"
  if (normalized === "in progress") return "In Progress"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const formatTestRequest = (row) => ({
  id: row.id,
  testName: row.test_type,
  details: row.description || "",
  status: formatStatus(row.status),
  rawStatus: row.status,
  date: formatDate(row.created_at),
  patientId: row.patient_id,
  patientName: row.patient_name,
  doctorId: row.doctor_id,
  doctorName: row.doctor_name,
  priority: row.priority || "Normal",
  reportData: row.report_data || null,
  reportFilePath: row.report_file_path || null,
  reportDate: formatDate(row.report_created_at),
})

const fetchTestRequestById = async (connection, id) => {
  const [[row]] = await connection.query(
    `SELECT t.id,
            t.test_type,
            t.description,
            t.status,
            t.created_at,
            p.id AS patient_id,
            uPatient.name AS patient_name,
            d.id AS doctor_id,
            uDoctor.name AS doctor_name,
            NULL AS priority,
            lr.report_data,
            lr.report_file_path,
            lr.created_at AS report_created_at
       FROM test_requests t
       JOIN patients p ON t.patient_id = p.id
       JOIN users uPatient ON p.user_id = uPatient.id
       JOIN doctors d ON t.doctor_id = d.id
       JOIN users uDoctor ON d.user_id = uDoctor.id
  LEFT JOIN lab_reports lr ON lr.test_request_id = t.id
      WHERE t.id = ?
      LIMIT 1`,
    [id],
  )

  return row ? formatTestRequest(row) : null
}

exports.listTestRequests = async (req, res) => {
  const statusFilter = req.query.status?.toString().toLowerCase()
  let connection

  try {
    connection = await pool.getConnection()

    let query =
       `SELECT t.id,
            t.test_type,
            t.description,
            t.status,
            t.created_at,
            p.id AS patient_id,
            uPatient.name AS patient_name,
            d.id AS doctor_id,
            uDoctor.name AS doctor_name,
            NULL AS priority,
            lr.report_data,
            lr.report_file_path,
            lr.created_at AS report_created_at
         FROM test_requests t
         JOIN patients p ON t.patient_id = p.id
         JOIN users uPatient ON p.user_id = uPatient.id
         JOIN doctors d ON t.doctor_id = d.id
          JOIN users uDoctor ON d.user_id = uDoctor.id
        LEFT JOIN lab_reports lr ON lr.test_request_id = t.id`

    const params = []
    if (statusFilter && statusFilter !== "all") {
      query += " WHERE LOWER(t.status) = ?"
      params.push(statusFilter.replace(/\s+/g, "-"))
    }

    query += " ORDER BY t.created_at DESC"

    const [rows] = await connection.query(query, params)

    res.json(rows.map(formatTestRequest))
  } catch (error) {
    console.error("Failed to fetch test requests", error)
    res.status(500).json({ message: "Failed to fetch test requests", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getTestRequestById = async (req, res) => {
  const { id } = req.params
  let connection

  try {
    connection = await pool.getConnection()
    const testRequest = await fetchTestRequestById(connection, id)

    if (!testRequest) {
      return res.status(404).json({ message: "Test request not found" })
    }

    res.json(testRequest)
  } catch (error) {
    console.error("Failed to fetch test request", error)
    res.status(500).json({ message: "Failed to fetch test request", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.createTestRequest = async (req, res) => {
  const patientId = req.body.patientId || req.body.patient_id
  const doctorId = req.body.doctorId || req.body.doctor_id
  const testType = req.body.testType || req.body.test_type
  const description = req.body.description || null
  const status = (req.body.status || "pending").toLowerCase().replace(/\s+/g, "-")

  if (!patientId || !doctorId || !testType) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  let connection
  try {
    connection = await pool.getConnection()

    const [result] = await connection.query(
      `INSERT INTO test_requests (patient_id, doctor_id, test_type, description, status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [patientId, doctorId, testType, description, status],
    )

    const createdTest = await fetchTestRequestById(connection, result.insertId)

    res.status(201).json({ message: "Test request created successfully", test: createdTest })
  } catch (error) {
    console.error("Failed to create test request", error)
    res.status(500).json({ message: "Failed to create test request", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.updateTestStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const normalizedStatus = status?.toString().toLowerCase().replace(/\s+/g, "-")
  const allowedStatuses = new Set(["pending", "in-progress", "completed", "cancelled"])

  if (!normalizedStatus || !allowedStatuses.has(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid status provided" })
  }

  let connection
  try {
    connection = await pool.getConnection()

    const [result] = await connection.query("UPDATE test_requests SET status = ? WHERE id = ?", [normalizedStatus, id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Test request not found" })
    }

    const updated = await fetchTestRequestById(connection, id)

    res.json({ message: "Test status updated successfully", test: updated })
  } catch (error) {
    console.error("Failed to update test status", error)
    res.status(500).json({ message: "Failed to update test status", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.uploadLabReport = async (req, res) => {
  const { id } = req.params
  const reportData = req.body.reportData || req.body.report_data || null
  const reportPath = req.body.reportFilePath || req.body.report_file_path || null

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const testRequest = await fetchTestRequestById(connection, id)
    if (!testRequest) {
      await connection.rollback()
      return res.status(404).json({ message: "Test request not found" })
    }

    const [[existingReport]] = await connection.query(
      "SELECT id FROM lab_reports WHERE test_request_id = ? LIMIT 1",
      [id],
    )

    if (existingReport) {
      await connection.query(
        "UPDATE lab_reports SET report_data = ?, report_file_path = ?, created_at = NOW() WHERE id = ?",
        [reportData, reportPath, existingReport.id],
      )
    } else {
      await connection.query(
        "INSERT INTO lab_reports (test_request_id, report_data, report_file_path, created_at) VALUES (?, ?, ?, NOW())",
        [id, reportData, reportPath],
      )
    }

    await connection.query("UPDATE test_requests SET status = 'completed' WHERE id = ?", [id])

    const [[reportRow]] = await connection.query(
      "SELECT id, test_request_id, report_data, report_file_path, created_at FROM lab_reports WHERE test_request_id = ?",
      [id],
    )

    await connection.commit()

    res.status(201).json({
      message: "Lab report uploaded successfully",
      report: {
        id: reportRow.id,
        testRequestId: reportRow.test_request_id,
        reportData: reportRow.report_data,
        reportFilePath: reportRow.report_file_path,
        date: formatDate(reportRow.created_at),
      },
    })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error("Failed to rollback lab report transaction", rollbackError)
      }
    }
    console.error("Failed to upload lab report", error)
    res.status(500).json({ message: "Failed to upload lab report", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getLabReport = async (req, res) => {
  const { id } = req.params
  let connection

  try {
    connection = await pool.getConnection()

    const [[report]] = await connection.query(
      "SELECT id, test_request_id, report_data, report_file_path, created_at FROM lab_reports WHERE test_request_id = ?",
      [id],
    )

    if (!report) {
      return res.status(404).json({ message: "Lab report not found" })
    }

    res.json({
      id: report.id,
      testRequestId: report.test_request_id,
      reportData: report.report_data,
      reportFilePath: report.report_file_path,
      date: formatDate(report.created_at),
    })
  } catch (error) {
    console.error("Failed to fetch lab report", error)
    res.status(500).json({ message: "Failed to fetch lab report", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}
