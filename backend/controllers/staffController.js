const pool = require("../config/database")

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

exports.getDashboard = async (req, res) => {
  let connection

  try {
    connection = await pool.getConnection()

    let totalPatients = 0
    let todayAppointments = 0
    let pendingTasks = 0
    let completedToday = 0
    let appointments = []

    try {
      const [[row]] = await connection.query("SELECT COUNT(*) AS totalPatients FROM patients")
      totalPatients = toNumber(row?.totalPatients)
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    try {
      const [[row]] = await connection.query(
        "SELECT COUNT(*) AS todayAppointments FROM appointments WHERE appointment_date = CURDATE()",
      )
      todayAppointments = toNumber(row?.todayAppointments)
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    try {
      const [[row]] = await connection.query(
        `SELECT COUNT(*) AS pendingTasks
           FROM appointments
          WHERE status IN ('scheduled', 'no-show')
            AND appointment_date >= CURDATE()`,
      )
      pendingTasks = toNumber(row?.pendingTasks)
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    try {
      const [[row]] = await connection.query(
        `SELECT COUNT(*) AS completedToday
           FROM appointments
          WHERE status = 'completed'
            AND appointment_date = CURDATE()`,
      )
      completedToday = toNumber(row?.completedToday)
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    try {
      const [rows] = await connection.query(
        `SELECT a.id,
                a.appointment_date AS appointmentDate,
                a.appointment_time AS appointmentTime,
                a.status,
                docUsers.name      AS doctorName,
                patUsers.name      AS patientName
           FROM appointments a
      LEFT JOIN doctors d ON d.id = a.doctor_id
      LEFT JOIN users docUsers ON docUsers.id = d.user_id
      LEFT JOIN patients p ON p.id = a.patient_id
      LEFT JOIN users patUsers ON patUsers.id = p.user_id
          WHERE a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
       ORDER BY a.appointment_date ASC, a.appointment_time ASC
          LIMIT 12`,
      )

      appointments = rows.map((row) => ({
        id: row.id,
        date: row.appointmentDate,
        time: row.appointmentTime,
        status: row.status,
        doctorName: row.doctorName,
        patientName: row.patientName,
      }))
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    res.json({
      metrics: {
        totalPatients,
        todayAppointments,
        pendingTasks,
        completedToday,
      },
      appointments,
    })
  } catch (error) {
    res.status(500).json({ message: "Failed to load staff dashboard", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

const mapAppointmentRow = (row = {}) => ({
  id: row.id,
  appointmentDate: row.appointmentDate,
  appointmentTime: row.appointmentTime,
  status: row.status,
  reason: row.reason,
  notes: row.notes,
  doctorId: row.doctorId,
  doctorName: row.doctorName,
  doctorEmail: row.doctorEmail,
  doctorSpecialization: row.doctorSpecialization,
  patientId: row.patientId,
  patientName: row.patientName,
  patientEmail: row.patientEmail,
  patientPhone: row.patientPhone,
  departmentId: row.departmentId,
  departmentName: row.departmentName,
})

const BASE_APPOINTMENT_SELECT = `SELECT a.id,
                                        a.appointment_date   AS appointmentDate,
                                        a.appointment_time   AS appointmentTime,
                                        a.status,
                                        a.reason,
                                        a.notes,
                                        d.id                 AS doctorId,
                                        docUsers.name        AS doctorName,
                                        docUsers.email       AS doctorEmail,
                                        d.specialization     AS doctorSpecialization,
                                        p.id                 AS patientId,
                                        patUsers.name        AS patientName,
                                        patUsers.email       AS patientEmail,
                                        p.phone              AS patientPhone,
                                        departments.id       AS departmentId,
                                        departments.name     AS departmentName
                                   FROM appointments a
                             LEFT JOIN doctors d ON d.id = a.doctor_id
                             LEFT JOIN departments ON departments.id = d.department_id
                             LEFT JOIN users docUsers ON docUsers.id = d.user_id
                             LEFT JOIN patients p ON p.id = a.patient_id
                             LEFT JOIN users patUsers ON patUsers.id = p.user_id`

const APPOINTMENT_ORDER = " ORDER BY a.appointment_date DESC, a.appointment_time DESC"

const buildAppointmentQuery = (filters = {}) => {
  const conditions = []
  const params = []

  if (filters.status && filters.status !== "all") {
    conditions.push("a.status = ?")
    params.push(filters.status)
  }

  if (filters.doctorId) {
    const doctorId = Number(filters.doctorId)
    if (!Number.isNaN(doctorId) && doctorId > 0) {
      conditions.push("a.doctor_id = ?")
      params.push(doctorId)
    }
  }

  if (filters.departmentId) {
    const departmentId = Number(filters.departmentId)
    if (!Number.isNaN(departmentId) && departmentId > 0) {
      conditions.push("departments.id = ?")
      params.push(departmentId)
    }
  }

  if (filters.dateFrom) {
    conditions.push("a.appointment_date >= ?")
    params.push(filters.dateFrom)
  }

  if (filters.dateTo) {
    conditions.push("a.appointment_date <= ?")
    params.push(filters.dateTo)
  }

  if (filters.searchTerm) {
    const searchValue = String(filters.searchTerm).toLowerCase()
    conditions.push(`(LOWER(patUsers.name) LIKE ? OR LOWER(docUsers.name) LIKE ? OR LOWER(a.reason) LIKE ?)`)
    const likeValue = `%${searchValue}%`
    params.push(likeValue, likeValue, likeValue)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  const query = `${BASE_APPOINTMENT_SELECT} ${whereClause}${APPOINTMENT_ORDER}`

  return { query, params }
}

const fetchAppointmentById = async (connection, id) => {
  const [rows] = await connection.query(`${BASE_APPOINTMENT_SELECT} WHERE a.id = ? LIMIT 1`, [Number(id)])
  return rows.length ? mapAppointmentRow(rows[0]) : null
}

exports.getAppointments = async (req, res) => {
  let connection

  try {
    connection = await pool.getConnection()

    const { query, params } = buildAppointmentQuery({
      status: req.query.status,
      doctorId: req.query.doctorId,
      departmentId: req.query.departmentId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      searchTerm: req.query.searchTerm,
    })

    const [rows] = await connection.query(query, params)
    const appointments = rows.map(mapAppointmentRow)

    res.json({ appointments })
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.json({ appointments: [] })
    }
    res.status(500).json({ message: "Failed to load staff appointments", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.updateAppointmentStatus = async (req, res) => {
  let connection

  const allowedStatuses = new Set(["scheduled", "completed", "cancelled", "no-show"])
  const { status, notes } = req.body || {}
  const appointmentId = Number.parseInt(req.params.id, 10)

  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return res.status(400).json({ message: "Invalid appointment id" })
  }

  const normalizedStatus = typeof status === "string" ? status.toLowerCase() : null

  if (!normalizedStatus || !allowedStatuses.has(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid appointment status" })
  }

  try {
    connection = await pool.getConnection()

    const [result] = await connection.query(
      `UPDATE appointments
          SET status = ?,
              notes = COALESCE(?, notes)
        WHERE id = ?
        LIMIT 1`,
      [normalizedStatus, notes ?? null, appointmentId],
    )

    const appointment = await fetchAppointmentById(connection, appointmentId)

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" })
    }

    res.json({ appointment, updated: result.changedRows > 0 })
  } catch (error) {
    res.status(500).json({ message: "Failed to update appointment status", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.rescheduleAppointment = async (req, res) => {
  let connection

  const appointmentId = Number.parseInt(req.params.id, 10)
  const { appointmentDate, appointmentTime, notes } = req.body || {}

  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return res.status(400).json({ message: "Invalid appointment id" })
  }

  if (!appointmentDate || !appointmentTime) {
    return res.status(400).json({ message: "New appointment date and time are required" })
  }

  try {
    connection = await pool.getConnection()

    const [result] = await connection.query(
      `UPDATE appointments
          SET appointment_date = ?,
              appointment_time = ?,
              status = CASE WHEN status = 'cancelled' THEN 'scheduled' ELSE status END,
              notes = COALESCE(?, notes)
        WHERE id = ?
        LIMIT 1`,
      [appointmentDate, appointmentTime, notes ?? null, appointmentId],
    )

    const appointment = await fetchAppointmentById(connection, appointmentId)

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" })
    }

    res.json({ appointment, updated: result.changedRows > 0 })
  } catch (error) {
    res.status(500).json({ message: "Failed to reschedule appointment", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getPatients = async (req, res) => {
  let connection

  try {
    connection = await pool.getConnection()

    const [rows] = await connection.query(
      `SELECT p.id,
              u.name               AS name,
              u.email              AS email,
              p.phone              AS phone,
              p.gender             AS gender,
              p.date_of_birth      AS dateOfBirth,
              p.blood_type         AS bloodType,
              p.address            AS address,
              p.emergency_contact  AS emergencyContact,
              p.created_at         AS registeredAt
         FROM patients p
         JOIN users u ON u.id = p.user_id
     ORDER BY u.name ASC`,
    )

    const patients = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      gender: row.gender,
      dateOfBirth: row.dateOfBirth,
      bloodType: row.bloodType,
      address: row.address,
      emergencyContact: row.emergencyContact,
      registeredAt: row.registeredAt,
    }))

    res.json({ patients })
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.json({ patients: [] })
    }
    res.status(500).json({ message: "Failed to load patients", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

