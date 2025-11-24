const pool = require("../config/database")

const DEFAULT_AVAILABILITY = [
  { day: "Monday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { day: "Tuesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { day: "Wednesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { day: "Thursday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { day: "Friday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { day: "Saturday", startTime: "10:00", endTime: "14:00", isAvailable: true },
  { day: "Sunday", startTime: "00:00", endTime: "00:00", isAvailable: false },
]

const formatStatus = (status) => {
  if (!status) return "Scheduled"
  const normalized = status.toString().toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const parseJsonField = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch (error) {
    return fallback
  }
}

const sanitizeMedications = (medications) => {
  if (!Array.isArray(medications)) return []

  return medications
    .map((med) => ({
      name: med?.name?.trim() || "",
      dosage: med?.dosage?.trim() || "",
      frequency: med?.frequency?.trim() || "",
      duration: med?.duration?.trim() || "",
    }))
    .filter((med) => med.name)
}

const ensureDoctor = async (connection, userId) => {
  const [rows] = await connection.query("SELECT id FROM doctors WHERE user_id = ? LIMIT 1", [userId])
  return rows[0]?.id || null
}

exports.getAppointments = async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  let connection

  try {
    connection = await pool.getConnection()
    const doctorId = await ensureDoctor(connection, userId)

    if (!doctorId) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    const statusFilter = req.query.status?.toString().toLowerCase()
    const queryParams = [doctorId]
    let statusClause = ""

    if (statusFilter && statusFilter !== "all") {
      statusClause = " AND LOWER(a.status) = ?"
      queryParams.push(statusFilter)
    }

    const [rows] = await connection.query(
      `SELECT
        a.id,
        a.patient_id,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointmentDate,
        DATE_FORMAT(a.appointment_time, '%h:%i %p') AS appointmentTime,
        a.reason,
        a.status,
        a.notes,
        u.name AS patientName,
        u.phone AS patientPhone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ?${statusClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      queryParams,
    )

    const appointments = rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patientName,
      patientPhone: row.patientPhone,
      date: row.appointmentDate,
      time: row.appointmentTime,
      reason: row.reason,
      status: formatStatus(row.status),
      notes: row.notes || "",
    }))

    res.json(appointments)
  } catch (error) {
    console.error("[doctorPortal] Failed to get appointments", error)
    res.status(500).json({ message: "Failed to load appointments", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getAppointmentById = async (req, res) => {
  const userId = req.user?.id
  const appointmentId = req.params.id

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  let connection

  try {
    connection = await pool.getConnection()
    const doctorId = await ensureDoctor(connection, userId)

    if (!doctorId) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    const [rows] = await connection.query(
      `SELECT
        a.id,
        a.patient_id,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointmentDate,
        DATE_FORMAT(a.appointment_time, '%h:%i %p') AS appointmentTime,
        a.reason,
        a.status,
        a.notes,
        u.name AS patientName,
        u.phone AS patientPhone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.id = ? AND a.doctor_id = ?
      LIMIT 1`,
      [appointmentId, doctorId],
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" })
    }

    const appointment = rows[0]

    res.json({
      id: appointment.id,
      patientId: appointment.patient_id,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      reason: appointment.reason,
      status: formatStatus(appointment.status),
      notes: appointment.notes || "",
    })
  } catch (error) {
    console.error("[doctorPortal] Failed to get appointment", error)
    res.status(500).json({ message: "Failed to load appointment", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.updateAppointmentStatus = async (req, res) => {
  const userId = req.user?.id
  const appointmentId = req.params.id
  const incomingStatus = req.body.status?.toString().toLowerCase()

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (!incomingStatus) {
    return res.status(400).json({ message: "Status is required" })
  }

  const allowedStatuses = new Set(["scheduled", "completed", "cancelled", "no-show"])

  if (!allowedStatuses.has(incomingStatus)) {
    return res.status(400).json({ message: "Invalid status" })
  }

  let connection

  try {
    connection = await pool.getConnection()
    const doctorId = await ensureDoctor(connection, userId)

    if (!doctorId) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    const [result] = await connection.query(
      "UPDATE appointments SET status = ? WHERE id = ? AND doctor_id = ?",
      [incomingStatus, appointmentId, doctorId],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found" })
    }

    res.json({ message: "Appointment updated", status: formatStatus(incomingStatus) })
  } catch (error) {
    console.error("[doctorPortal] Failed to update appointment", error)
    res.status(500).json({ message: "Failed to update appointment", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getAvailability = async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  let connection

  try {
    connection = await pool.getConnection()
    const doctorId = await ensureDoctor(connection, userId)

    if (!doctorId) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    const [rows] = await connection.query("SELECT availability FROM doctors WHERE id = ?", [doctorId])
    const availability = parseJsonField(rows[0]?.availability, DEFAULT_AVAILABILITY)

    res.json({ availability })
  } catch (error) {
    console.error("[doctorPortal] Failed to get availability", error)
    res.status(500).json({ message: "Failed to load availability", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.updateAvailability = async (req, res) => {
  const userId = req.user?.id
  const availabilityPayload = req.body.availability

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (!Array.isArray(availabilityPayload)) {
    return res.status(400).json({ message: "Availability must be an array" })
  }

  let connection

  try {
    connection = await pool.getConnection()
    const doctorId = await ensureDoctor(connection, userId)

    if (!doctorId) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    await connection.query("UPDATE doctors SET availability = ? WHERE id = ?", [JSON.stringify(availabilityPayload), doctorId])

    res.json({ message: "Availability updated" })
  } catch (error) {
    console.error("[doctorPortal] Failed to update availability", error)
    res.status(500).json({ message: "Failed to update availability", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.createPrescription = async (req, res) => {
  const userId = req.user?.id
  const { patientId, medications, notes } = req.body

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const sanitizedMedications = sanitizeMedications(medications)

  if (!patientId || sanitizedMedications.length === 0) {
    return res.status(400).json({ message: "Patient and at least one medication are required" })
  }

  let connection

  try {
    connection = await pool.getConnection()
    const doctorId = await ensureDoctor(connection, userId)

    if (!doctorId) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    const identifier = patientId.toString().trim()
    let patientRecord

    if (/^\d+$/.test(identifier)) {
      const [rows] = await connection.query(
        `SELECT p.id, u.name
         FROM patients p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = ?
         LIMIT 1`,
        [Number(identifier)],
      )
      patientRecord = rows[0]
    } else {
      const [rows] = await connection.query(
        `SELECT p.id, u.name
         FROM patients p
         JOIN users u ON p.user_id = u.id
         WHERE u.name = ? OR u.email = ?
         LIMIT 1`,
        [identifier, identifier],
      )
      patientRecord = rows[0]
    }

    if (!patientRecord) {
      return res.status(404).json({ message: "Patient not found" })
    }

    const payload = {
      notes: notes?.toString().trim() || "",
      medications: sanitizedMedications,
    }

    const [result] = await connection.query(
      `INSERT INTO prescriptions (patient_id, doctor_id, prescription_date, notes, status)
       VALUES (?, ?, CURDATE(), ?, 'active')`,
      [patientRecord.id, doctorId, JSON.stringify(payload)],
    )

    res.status(201).json({ message: "Prescription created", id: result.insertId })
  } catch (error) {
    console.error("[doctorPortal] Failed to create prescription", error)
    res.status(500).json({ message: "Failed to create prescription", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getPrescriptions = async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  let connection

  try {
    connection = await pool.getConnection()
    const doctorId = await ensureDoctor(connection, userId)

    if (!doctorId) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    const [rows] = await connection.query(
      `SELECT
        pr.id,
        pr.patient_id,
        DATE_FORMAT(pr.prescription_date, '%Y-%m-%d') AS prescriptionDate,
        pr.notes,
        pr.status,
        u.name AS patientName
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE pr.doctor_id = ?
      ORDER BY pr.prescription_date DESC, pr.id DESC`,
      [doctorId],
    )

    const prescriptions = rows.map((row) => {
      const details = parseJsonField(row.notes, { notes: row.notes || "", medications: [] })
      const medicationsList = Array.isArray(details.medications) ? details.medications : []

      return {
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patientName,
        date: row.prescriptionDate,
        status: formatStatus(row.status),
        notes: details.notes || "",
        medications: medicationsList,
      }
    })

    res.json(prescriptions)
  } catch (error) {
    console.error("[doctorPortal] Failed to get prescriptions", error)
    res.status(500).json({ message: "Failed to load prescriptions", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getPatients = async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  let connection

  try {
    connection = await pool.getConnection()
    const doctorId = await ensureDoctor(connection, userId)

    if (!doctorId) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    const [rows] = await connection.query(
      `SELECT
        p.id,
        u.name,
        u.email,
        u.phone,
        DATE_FORMAT(p.date_of_birth, '%Y-%m-%d') AS dateOfBirth,
        p.gender,
        p.blood_type,
        p.address,
        MAX(a.appointment_date) AS lastAppointmentDate,
        SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completedAppointments,
        SUM(CASE WHEN a.status = 'scheduled' THEN 1 ELSE 0 END) AS upcomingAppointments
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE a.doctor_id = ?
       GROUP BY p.id, u.name, u.email, u.phone, p.date_of_birth, p.gender, p.blood_type, p.address
       ORDER BY u.name ASC`,
      [doctorId],
    )

    const patients = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.dateOfBirth,
      gender: row.gender,
      bloodType: row.blood_type,
      address: row.address,
      lastAppointment: row.lastAppointmentDate || null,
      completedAppointments: Number(row.completedAppointments) || 0,
      upcomingAppointments: Number(row.upcomingAppointments) || 0,
    }))

    res.json(patients)
  } catch (error) {
    console.error("[doctorPortal] Failed to get patients", error)
    res.status(500).json({ message: "Failed to load patients", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getPatientHistory = async (req, res) => {
  const userId = req.user?.id
  const patientIdParam = req.params.patientId

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const patientId = Number.parseInt(patientIdParam, 10)

  if (Number.isNaN(patientId)) {
    return res.status(400).json({ message: "Invalid patient identifier" })
  }

  let connection

  try {
    connection = await pool.getConnection()
    const doctorId = await ensureDoctor(connection, userId)

    if (!doctorId) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    const [[patientRow]] = await connection.query(
      `SELECT u.name AS patientName
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?
       LIMIT 1`,
      [patientId],
    )

    if (!patientRow) {
      return res.status(404).json({ message: "Patient not found" })
    }

    const [appointmentRows] = await connection.query(
      `SELECT
        a.id,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointmentDate,
        DATE_FORMAT(a.appointment_time, '%h:%i %p') AS appointmentTime,
        a.status,
        a.reason,
        a.notes
       FROM appointments a
       WHERE a.patient_id = ? AND a.doctor_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patientId, doctorId],
    )

    const [prescriptionRows] = await connection.query(
      `SELECT
        pr.id,
        DATE_FORMAT(pr.prescription_date, '%Y-%m-%d') AS prescriptionDate,
        pr.notes,
        pr.status
       FROM prescriptions pr
       WHERE pr.patient_id = ? AND pr.doctor_id = ?
       ORDER BY pr.prescription_date DESC, pr.id DESC`,
      [patientId, doctorId],
    )

    const appointments = appointmentRows.map((row) => ({
      id: row.id,
      date: row.appointmentDate,
      time: row.appointmentTime,
      status: formatStatus(row.status),
      reason: row.reason,
      notes: row.notes || "",
    }))

    const prescriptions = prescriptionRows.map((row) => {
      const details = parseJsonField(row.notes, { notes: row.notes || "", medications: [] })
      const medicationsList = Array.isArray(details.medications) ? details.medications : []

      return {
        id: row.id,
        date: row.prescriptionDate,
        status: formatStatus(row.status),
        notes: details.notes || "",
        medications: medicationsList,
      }
    })

    res.json({
      patient: { id: patientId, name: patientRow.patientName },
      appointments,
      prescriptions,
    })
  } catch (error) {
    console.error("[doctorPortal] Failed to get patient history", error)
    res.status(500).json({ message: "Failed to load patient history", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}
