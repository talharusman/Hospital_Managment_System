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

const normalizeCurrency = (value) => {
  if (value === null || value === undefined) return null
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) return null
  return Number.parseFloat(numeric.toFixed(2))
}

const toPositiveCurrency = (value) => {
  const normalized = normalizeCurrency(value)
  if (normalized === null || normalized <= 0) {
    return null
  }
  return normalized
}

const formatTimestamp = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
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
  patientEmail: row.patient_email || null,
  patientPhone: row.patient_phone || null,
  doctorId: row.doctor_id,
  doctorName: row.doctor_name,
  priority: row.priority || "Normal",
  reportData: row.report_data || null,
  reportFilePath: row.report_file_path || null,
  reportDate: formatDate(row.report_created_at),
  billingAmount: normalizeCurrency(row.billing_amount),
  billingInvoiceId: row.billing_invoice_id || null,
  billedAt: formatTimestamp(row.billed_at),
})

const fetchTestRequestById = async (connection, id) => {
  const [[row]] = await connection.query(
        `SELECT t.id,
            t.test_type,
            t.description,
            t.status,
          t.billing_amount,
          t.billing_invoice_id,
          t.billed_at,
            t.created_at,
            p.id AS patient_id,
            uPatient.name AS patient_name,
          uPatient.email AS patient_email,
          uPatient.phone AS patient_phone,
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
          t.billing_amount,
          t.billing_invoice_id,
          t.billed_at,
            t.created_at,
            p.id AS patient_id,
            uPatient.name AS patient_name,
          uPatient.email AS patient_email,
          uPatient.phone AS patient_phone,
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

exports.billTestRequest = async (req, res) => {
  const testId = Number.parseInt(req.params?.id, 10)
  if (!Number.isInteger(testId) || testId <= 0) {
    return res.status(400).json({ message: "Valid test request id is required" })
  }

  const chargeAmount =
    toPositiveCurrency(req.body?.amount) ??
    toPositiveCurrency(req.body?.amount_paid) ??
    toPositiveCurrency(req.body?.charge) ??
    toPositiveCurrency(req.body?.chargeAmount)

  if (chargeAmount === null) {
    return res.status(400).json({ message: "A positive amount is required" })
  }

  const descriptionInput =
    req.body?.description ?? req.body?.notes ?? req.body?.line_item ?? req.body?.lineItem ?? null
  const dueDateInput = req.body?.dueDate ?? req.body?.due_date ?? null
  const trimmedDueDate = dueDateInput && `${dueDateInput}`.trim()
  const dueDateNormalized =
    trimmedDueDate && /^\d{4}-\d{2}-\d{2}$/.test(trimmedDueDate) ? trimmedDueDate : null

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [rows] = await connection.query(
      `SELECT t.id,
              t.test_type,
              t.status,
              t.billing_invoice_id,
              p.id  AS patient_id,
              u.name AS patient_name
         FROM test_requests t
         JOIN patients p ON t.patient_id = p.id
         JOIN users u ON p.user_id = u.id
        WHERE t.id = ?
        FOR UPDATE`,
      [testId],
    )

    if (!rows || rows.length === 0) {
      await connection.rollback()
      return res.status(404).json({ message: "Test request not found" })
    }

    const test = rows[0]

    if (test.status !== "completed") {
      await connection.rollback()
      return res.status(400).json({ message: "Only completed lab reports can be billed" })
    }

    const descriptionLine = (descriptionInput || "")
      .toString()
      .trim()
      .replace(/\s+/g, " ") || `Lab charge: ${test.test_type}`

    const [invoiceRows] = await connection.query(
      `SELECT id, amount, description
         FROM invoices
        WHERE patient_id = ?
          AND status = 'pending'
     ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE`,
      [test.patient_id],
    )

    let invoiceAction
    let invoiceId

    if (invoiceRows.length > 0) {
      const invoice = invoiceRows[0]
      const currentAmount = Number.parseFloat(invoice.amount) || 0
      const updatedAmount = Number.parseFloat((currentAmount + chargeAmount).toFixed(2))
      const mergedDescription = [invoice.description, descriptionLine].filter(Boolean).join("\n")

      await connection.query("UPDATE invoices SET amount = ?, description = ? WHERE id = ?", [
        updatedAmount,
        mergedDescription || null,
        invoice.id,
      ])

      invoiceAction = {
        type: "updated",
        invoiceId: invoice.id,
        amountAppended: chargeAmount,
        updatedTotal: updatedAmount,
      }
      invoiceId = invoice.id
    } else {
      const [insertResult] = await connection.query(
        "INSERT INTO invoices (patient_id, amount, description, due_date, status, created_at) VALUES (?, ?, ?, ?, 'pending', NOW())",
        [test.patient_id, chargeAmount, descriptionLine, dueDateNormalized],
      )

      invoiceAction = {
        type: "created",
        invoiceId: insertResult.insertId,
        amountAppended: chargeAmount,
        updatedTotal: chargeAmount,
      }
      invoiceId = insertResult.insertId
    }

    await connection.query(
      `UPDATE test_requests
          SET billing_amount = COALESCE(billing_amount, 0) + ?,
              billing_invoice_id = ?,
              billed_at = NOW()
        WHERE id = ?`,
      [chargeAmount, invoiceId, testId],
    )

    const updatedTest = await fetchTestRequestById(connection, testId)

    await connection.commit()

    const responseMessage =
      invoiceAction.type === "updated"
        ? "Lab charge applied to pending invoice"
        : "Lab charge added and new invoice created"

    res.status(201).json({
      message: responseMessage,
      invoiceAction,
      test: updatedTest,
    })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error("Failed to rollback lab billing", rollbackError)
      }
    }
    console.error("Failed to bill lab test", error)
    res.status(500).json({ message: "Failed to bill lab test", error: error.message })
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
