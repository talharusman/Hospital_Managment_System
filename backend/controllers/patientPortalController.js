const pool = require("../config/database")

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return `$${amount.toFixed(2)}`
}

const toTitleCase = (value) => {
  if (!value) return ""
  const stringValue = String(value).trim()
  if (stringValue.length === 0) return ""
  return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase()
}

const formatDate = (dateValue) => {
  if (!dateValue) return ""
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().split("T")[0]
}

const formatTime = (timeValue) => {
  if (!timeValue) return ""
  const [hour, minute] = timeValue.split(":")
  if (hour === undefined || minute === undefined) return timeValue
  const h = Number(hour)
  if (Number.isNaN(h)) return timeValue
  const period = h >= 12 ? "PM" : "AM"
  const normalizedHour = ((h + 11) % 12) + 1
  return `${normalizedHour}:${minute}${period}`
}

const parseSlotTime = (slot) => {
  if (!slot) return null

  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(slot)) {
    const [hour, minute, second] = slot.split(":")
    if (hour === undefined || minute === undefined) {
      return null
    }
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${(second || "00").padStart(2, "0")}`
  }

  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  let [_, hourStr, minuteStr, period] = match
  let hour = Number(hourStr)
  if (Number.isNaN(hour)) return null
  if (period.toUpperCase() === "PM" && hour !== 12) {
    hour += 12
  }
  if (period.toUpperCase() === "AM" && hour === 12) {
    hour = 0
  }
  return `${hour.toString().padStart(2, "0")}:${minuteStr}:00`
}

const parseAvailability = (availability) => {
  if (!availability) return []

  try {
    const parsed = typeof availability === "string" ? JSON.parse(availability) : availability
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("Failed to parse availability", error)
    return []
  }
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const parseDateParts = (dateString) => {
  const parts = dateString?.split("-")
  if (!parts || parts.length !== 3) {
    return null
  }
  const [yearStr, monthStr, dayStr] = parts
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }
  return { year, month, day }
}

const getDayNameFromDate = (dateString) => {
  const parsed = parseDateParts(dateString)
  if (!parsed) return null
  const { year, month, day } = parsed
  const date = new Date(Date.UTC(year, month - 1, day))
  return dayNames[date.getUTCDay()]
}

const isDateOnOrAfterToday = (dateString) => {
  const parsed = parseDateParts(dateString)
  if (!parsed) return false
  const { year, month, day } = parsed
  const targetDate = new Date(year, month - 1, day)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return targetDate >= todayStart
}

const timeToMinutes = (timeString) => {
  if (!timeString) return null
  const [hourStr, minuteStr] = timeString.split(":")
  if (hourStr === undefined || minuteStr === undefined) return null
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  return hour * 60 + minute
}

const minutesToTime = (minutes) => {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`
}

const generateSlots = (startTime, endTime, intervalMinutes = 30) => {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return []
  }

  const slots = []
  for (let current = startMinutes; current <= endMinutes - intervalMinutes; current += intervalMinutes) {
    slots.push(minutesToTime(current))
  }
  return slots
}

const isSameDate = (inputDate, referenceDate) => {
  const parsed = parseDateParts(inputDate)
  if (!parsed) return false
  const { year, month, day } = parsed
  return (
    year === referenceDate.getFullYear() &&
    month === referenceDate.getMonth() + 1 &&
    day === referenceDate.getDate()
  )
}

const isTimeInFuture = (timeString, referenceDate) => {
  const [hourStr, minuteStr] = timeString.split(":")
  if (hourStr === undefined || minuteStr === undefined) {
    return false
  }
  const slotMinutes = Number(hourStr) * 60 + Number(minuteStr)
  if (Number.isNaN(slotMinutes)) {
    return false
  }
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes()
  return slotMinutes > currentMinutes
}

const fetchPatientByUserId = async (connection, userId) => {
  const [patients] = await connection.query("SELECT id FROM patients WHERE user_id = ?", [userId])
  return patients[0]
}

const formatInvoiceSummary = (invoiceRow) => {
  if (!invoiceRow) return null
  const createdAt = invoiceRow.created_at ? new Date(invoiceRow.created_at) : new Date()
  return {
    id: invoiceRow.id,
    invoiceNumber: `INV-${createdAt.getFullYear()}-${invoiceRow.id.toString().padStart(4, "0")}`,
    date: formatDate(invoiceRow.created_at),
    amount: formatCurrency(invoiceRow.amount),
    status: toTitleCase(invoiceRow.status),
    description: invoiceRow.description || "Hospital services",
    breakdown: [
      {
        item: invoiceRow.description || "Services",
        amount: formatCurrency(invoiceRow.amount),
      },
    ],
  }
}

const fetchInvoiceDetailsForPatient = async (connection, patientId, invoiceId) => {
  const [[invoiceRow]] = await connection.query(
    `SELECT id, amount, description, created_at, status
       FROM invoices
      WHERE id = ? AND patient_id = ?
      LIMIT 1`,
    [invoiceId, patientId],
  )

  if (!invoiceRow) {
    return null
  }

  const [paymentRows] = await connection.query(
    `SELECT amount_paid, payment_method, payment_date
       FROM payments
      WHERE invoice_id = ?
   ORDER BY payment_date DESC`,
    [invoiceRow.id],
  )

  return {
    ...formatInvoiceSummary(invoiceRow),
    payments: paymentRows.map((payment) => ({
      amount: formatCurrency(payment.amount_paid),
      method: toTitleCase(payment.payment_method),
      date: formatDate(payment.payment_date),
    })),
  }
}

exports.getDashboard = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const patient = await fetchPatientByUserId(connection, userId)

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" })
    }

    const patientId = patient.id

    await connection.query(
      `UPDATE appointments
          SET status = 'cancelled'
        WHERE patient_id = ?
          AND appointment_date < CURDATE()
          AND status NOT IN ('completed', 'cancelled')`,
      [patientId],
    )

    const [[prescriptionStats]] = await connection.query(
      "SELECT COUNT(*) AS totalPrescriptions FROM prescriptions WHERE patient_id = ?",
      [patientId],
    )

    const [[labStats]] = await connection.query(
      "SELECT COUNT(*) AS labReports FROM lab_reports lr JOIN test_requests tr ON lr.test_request_id = tr.id WHERE tr.patient_id = ?",
      [patientId],
    )

    const [[billingStats]] = await connection.query(
      "SELECT COALESCE(SUM(amount), 0) AS totalBilled FROM invoices WHERE patient_id = ?",
      [patientId],
    )

    const [appointmentRows] = await connection.query(
      `SELECT a.id,
              a.appointment_date,
              DATE_FORMAT(a.appointment_time, '%H:%i') AS appointment_time,
              a.status,
              u.name AS doctorName
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u ON d.user_id = u.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patientId],
    )

    const normalizedAppointments = appointmentRows.map((appt) => {
      const date = formatDate(appt.appointment_date)
      const status = toTitleCase(appt.status)
      return {
        id: appt.id,
        doctorName: appt.doctorName,
        date,
        time: formatTime(appt.appointment_time),
        status,
      }
    })

    const visibleStatuses = new Set(["Scheduled", "Completed", "Cancelled"])
    const visibleAppointments = normalizedAppointments.filter((appt) => visibleStatuses.has(appt.status))

    const upcomingCount = visibleAppointments.filter(
      (appt) => appt.status === "Scheduled" && isDateOnOrAfterToday(appt.date),
    ).length

    const RECENT_LIMIT = 5
    const formattedAppointments = visibleAppointments.slice(0, RECENT_LIMIT).map((appt) => ({
      id: appt.id,
      doctorName: appt.doctorName,
      date: appt.date,
      time: appt.time,
      status: appt.status,
    }))

    res.json({
      upcomingAppointments: upcomingCount,
      totalPrescriptions: prescriptionStats?.totalPrescriptions ?? 0,
      labReports: labStats?.labReports ?? 0,
      totalBilled: formatCurrency(billingStats?.totalBilled ?? 0),
      recentAppointments: formattedAppointments,
    })
  } catch (error) {
    console.error("Failed to load patient dashboard", error)
    res.status(500).json({ message: "Failed to load dashboard", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getAppointments = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const patient = await fetchPatientByUserId(connection, userId)
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" })
    }

    await connection.query(
      `UPDATE appointments
          SET status = 'cancelled'
        WHERE patient_id = ?
          AND appointment_date < CURDATE()
          AND status NOT IN ('completed', 'cancelled')`,
      [patient.id],
    )

    const [appointments] = await connection.query(
      `SELECT a.id,
              a.reason,
              a.appointment_date,
              DATE_FORMAT(a.appointment_time, '%H:%i') AS appointment_time,
              a.status,
              u.name AS doctorName,
              u.phone AS doctorPhone,
              dept.name AS departmentName
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u ON d.user_id = u.id
    LEFT JOIN departments dept ON d.department_id = dept.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patient.id],
    )

    const formatted = appointments.map((appt) => ({
      id: appt.id,
      doctorName: appt.doctorName,
      department: appt.departmentName || "General",
      date: formatDate(appt.appointment_date),
      time: formatTime(appt.appointment_time),
      status: toTitleCase(appt.status),
      location: `${appt.departmentName || "Outpatient"} Clinic`,
      phone: appt.doctorPhone || "N/A",
      reason: appt.reason,
    }))

    res.json(formatted)
  } catch (error) {
    console.error("Failed to load appointments", error)
    res.status(500).json({ message: "Failed to load appointments", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getAppointmentById = async (req, res) => {
  const userId = req.user?.id
  const appointmentId = req.params.id

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const patient = await fetchPatientByUserId(connection, userId)
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" })
    }

    const [[appointment]] = await connection.query(
      `SELECT a.id,
              a.reason,
              a.notes,
              a.status,
              a.appointment_date,
              DATE_FORMAT(a.appointment_time, '%H:%i') AS appointment_time,
              u.name AS doctorName,
              u.email AS doctorEmail,
              u.phone AS doctorPhone,
              dept.name AS departmentName
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u ON d.user_id = u.id
    LEFT JOIN departments dept ON d.department_id = dept.id
        WHERE a.patient_id = ? AND a.id = ?
        LIMIT 1`,
      [patient.id, appointmentId],
    )

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" })
    }

    res.json({
      id: appointment.id,
      doctorName: appointment.doctorName,
      doctorEmail: appointment.doctorEmail,
      doctorPhone: appointment.doctorPhone,
      department: appointment.departmentName || "General",
      date: formatDate(appointment.appointment_date),
      time: formatTime(appointment.appointment_time),
      status: toTitleCase(appointment.status),
      reason: appointment.reason,
      notes: appointment.notes,
    })
  } catch (error) {
    console.error("Failed to load appointment", error)
    res.status(500).json({ message: "Failed to load appointment", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getDoctors = async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    let rows

    try {
      ;[rows] = await connection.query(
        `SELECT d.id,
                d.specialization,
                d.department_id,
                d.availability,
                dept.name AS departmentName,
                u.name,
                u.email,
                u.phone
           FROM doctors d
           JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
          ORDER BY u.name ASC`,
      )
    } catch (error) {
      if (error?.code === "ER_NO_SUCH_TABLE") {
        ;[rows] = await connection.query(
          `SELECT d.id,
                  d.specialization,
                  d.department_id,
                  d.availability,
                  NULL AS departmentName,
                  u.name,
                  u.email,
                  u.phone
             FROM doctors d
             JOIN users u ON d.user_id = u.id
            ORDER BY u.name ASC`,
        )
      } else {
        throw error
      }
    }

    const doctors = rows.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization || "General Medicine",
      department: doctor.departmentName || "General Medicine",
      availability: parseAvailability(doctor.availability),
    }))

    res.json(doctors)
  } catch (error) {
    console.error("Failed to load doctors", error)
    res.status(500).json({ message: "Failed to load doctors", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getDoctorAvailability = async (req, res) => {
  const doctorId = Number(req.params.id)
  const { date } = req.query

  if (!doctorId) {
    return res.status(400).json({ message: "Invalid doctor" })
  }
  if (!date) {
    return res.status(400).json({ message: "Date is required" })
  }

  const dayName = getDayNameFromDate(date)
  if (!dayName) {
    return res.status(400).json({ message: "Invalid date" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const [[doctor]] = await connection.query(
      "SELECT id, availability FROM doctors WHERE id = ?",
      [doctorId],
    )

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" })
    }

    const availability = parseAvailability(doctor.availability)
    const dayAvailability = availability.find(
      (item) => item.day && item.day.toLowerCase() === dayName.toLowerCase() && item.isAvailable !== false,
    )

    if (!dayAvailability) {
      return res.json({ date, slots: [] })
    }

    const generatedSlots = generateSlots(dayAvailability.startTime, dayAvailability.endTime)

    if (generatedSlots.length === 0) {
      return res.json({ date, slots: [] })
    }

    const [bookedRows] = await connection.query(
      `SELECT TIME_FORMAT(appointment_time, '%H:%i:%s') AS appointment_time
         FROM appointments
        WHERE doctor_id = ?
          AND appointment_date = ?
          AND status != 'cancelled'`,
      [doctorId, date],
    )

    const bookedSet = new Set(bookedRows.map((row) => row.appointment_time))
    const now = new Date()
    const isToday = isSameDate(date, now)

    const availableSlots = generatedSlots
      .filter((slot) => !bookedSet.has(slot))
      .filter((slot) => !isToday || isTimeInFuture(slot, now))
      .map((slot) => ({ value: slot, label: formatTime(slot) }))

    res.json({ date, slots: availableSlots })
  } catch (error) {
    console.error("Failed to load doctor availability", error)
    res.status(500).json({ message: "Failed to load availability", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.bookAppointment = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  const { doctorId, date, time, reason } = req.body
  if (!doctorId || !date || !time || !reason) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  const doctorIdNumber = Number(doctorId)
  if (!Number.isInteger(doctorIdNumber) || doctorIdNumber <= 0) {
    return res.status(400).json({ message: "Invalid doctor" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const patient = await fetchPatientByUserId(connection, userId)
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" })
    }

    const [[doctor]] = await connection.query("SELECT id, availability FROM doctors WHERE id = ?", [doctorIdNumber])
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" })
    }

    const appointmentTime = parseSlotTime(time)
    if (!appointmentTime) {
      return res.status(400).json({ message: "Invalid time format" })
    }

    const availability = parseAvailability(doctor.availability)
    const dayName = getDayNameFromDate(date)
    const dayAvailability = availability.find(
      (item) => item.day && item.day.toLowerCase() === dayName?.toLowerCase() && item.isAvailable !== false,
    )

    if (!dayAvailability) {
      return res.status(400).json({ message: "Selected doctor is unavailable on this date" })
    }

    const generatedSlots = generateSlots(dayAvailability.startTime, dayAvailability.endTime)
    if (!generatedSlots.includes(appointmentTime)) {
      return res.status(400).json({ message: "Selected time is outside doctor's availability" })
    }

    const [[conflict]] = await connection.query(
      `SELECT id
         FROM appointments
        WHERE doctor_id = ?
          AND appointment_date = ?
          AND appointment_time = ?
          AND status != 'cancelled'
        LIMIT 1`,
      [doctorIdNumber, date, appointmentTime],
    )

    if (conflict) {
      return res.status(409).json({ message: "Time slot already booked" })
    }

    await connection.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, 'scheduled', NULL, NOW())`,
      [patient.id, doctorIdNumber, date, appointmentTime, reason],
    )

    res.status(201).json({ message: "Appointment booked successfully" })
  } catch (error) {
    console.error("Failed to book appointment", error)
    res.status(500).json({ message: "Failed to book appointment", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.cancelAppointment = async (req, res) => {
  const userId = req.user?.id
  const appointmentId = req.params.id

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const patient = await fetchPatientByUserId(connection, userId)
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" })
    }

    const [result] = await connection.query(
      `UPDATE appointments
          SET status = 'cancelled'
        WHERE id = ? AND patient_id = ? AND status != 'cancelled'`,
      [appointmentId, patient.id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found or already cancelled" })
    }

    res.json({ message: "Appointment cancelled successfully" })
  } catch (error) {
    console.error("Failed to cancel appointment", error)
    res.status(500).json({ message: "Failed to cancel appointment", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getPrescriptions = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const patient = await fetchPatientByUserId(connection, userId)
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" })
    }

    const [rows] = await connection.query(
      `SELECT p.id,
              p.prescription_date,
              p.notes,
              u.name AS doctorName
         FROM prescriptions p
         JOIN doctors d ON p.doctor_id = d.id
         JOIN users u ON d.user_id = u.id
        WHERE p.patient_id = ?
        ORDER BY p.prescription_date DESC`,
      [patient.id],
    )

    const prescriptions = rows.map((row) => {
      let parsedNotes
      try {
        parsedNotes = row.notes ? JSON.parse(row.notes) : {}
      } catch (err) {
        parsedNotes = { notes: row.notes, medications: [] }
      }
      return {
        id: row.id,
        doctorName: row.doctorName,
        date: formatDate(row.prescription_date),
        medications: parsedNotes.medications || [],
        notes: parsedNotes.notes || "",
      }
    })

    res.json(prescriptions)
  } catch (error) {
    console.error("Failed to load prescriptions", error)
    res.status(500).json({ message: "Failed to load prescriptions", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getLabReports = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const patient = await fetchPatientByUserId(connection, userId)
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" })
    }

    const [rows] = await connection.query(
      `SELECT tr.id,
              tr.test_type,
              tr.description,
              tr.status,
              tr.created_at,
              lr.report_data,
              lr.report_file_path
         FROM test_requests tr
    LEFT JOIN lab_reports lr ON tr.id = lr.test_request_id
        WHERE tr.patient_id = ?
        ORDER BY tr.created_at DESC`,
      [patient.id],
    )

    const reports = rows.map((row) => ({
      id: row.id,
      testName: row.test_type,
      date: formatDate(row.created_at),
      status: toTitleCase(row.status),
      labName: "Central Diagnostic Lab",
      results: row.report_data || row.description || "Pending",
      reportFile: row.report_file_path || null,
    }))

    res.json(reports)
  } catch (error) {
    console.error("Failed to load lab reports", error)
    res.status(500).json({ message: "Failed to load lab reports", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getInvoices = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const patient = await fetchPatientByUserId(connection, userId)
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" })
    }

    const [rows] = await connection.query(
      `SELECT id, amount, description, created_at, status FROM invoices WHERE patient_id = ? ORDER BY created_at DESC`,
      [patient.id],
    )

    const invoices = rows.map(formatInvoiceSummary)

    res.json(invoices)
  } catch (error) {
    console.error("Failed to load invoices", error)
    res.status(500).json({ message: "Failed to load invoices", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getInvoiceById = async (req, res) => {
  const userId = req.user?.id
  const invoiceId = req.params.id

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    const patient = await fetchPatientByUserId(connection, userId)
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" })
    }

    const invoice = await fetchInvoiceDetailsForPatient(connection, patient.id, invoiceId)

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" })
    }

    res.json(invoice)
  } catch (error) {
    console.error("Failed to load invoice", error)
    res.status(500).json({ message: "Failed to load invoice", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.payInvoice = async (req, res) => {
  const userId = req.user?.id
  const invoiceId = req.params.id
  const { paymentMethod = "online" } = req.body || {}

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const patient = await fetchPatientByUserId(connection, userId)
    if (!patient) {
      await connection.rollback()
      return res.status(404).json({ message: "Patient profile not found" })
    }

    const [[invoiceRow]] = await connection.query(
      `SELECT id, amount, status, description, created_at
         FROM invoices
        WHERE id = ? AND patient_id = ?
        LIMIT 1
        FOR UPDATE`,
      [invoiceId, patient.id],
    )

    if (!invoiceRow) {
      await connection.rollback()
      return res.status(404).json({ message: "Invoice not found" })
    }

    if (invoiceRow.status === "paid") {
      await connection.rollback()
      return res.status(400).json({ message: "Invoice is already paid" })
    }

    const normalizedMethod = typeof paymentMethod === "string" && paymentMethod.trim() !== ""
      ? paymentMethod.trim().toLowerCase().replace(/\s+/g, "_")
      : "online"

    await connection.query(
      `UPDATE invoices
          SET status = 'paid'
        WHERE id = ?`,
      [invoiceRow.id],
    )

    await connection.query(
      `INSERT INTO payments (invoice_id, amount_paid, payment_method, payment_date)
       VALUES (?, ?, ?, NOW())`,
      [invoiceRow.id, invoiceRow.amount, normalizedMethod],
    )

    const invoiceDetails = await fetchInvoiceDetailsForPatient(connection, patient.id, invoiceRow.id)

    await connection.commit()

    res.json({
      message: "Payment recorded successfully",
      invoice: invoiceDetails,
    })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error("Failed to rollback transaction", rollbackError)
      }
    }
    console.error("Failed to process payment", error)
    res.status(500).json({ message: "Failed to process payment", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}
