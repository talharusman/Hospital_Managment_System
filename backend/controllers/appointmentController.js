const pool = require("../config/database")

// Get all appointments
exports.getAllAppointments = async (req, res) => {
  try {
    const connection = await pool.getConnection()
    const [appointments] = await connection.query(
      `SELECT a.*, p.id as patient_id, d.id as doctor_id, u1.name as patient_name, u2.name as doctor_name 
       FROM appointments a 
       JOIN patients p ON a.patient_id = p.id 
       JOIN doctors d ON a.doctor_id = d.id 
       JOIN users u1 ON p.user_id = u1.id 
       JOIN users u2 ON d.user_id = u2.id`,
    )
    connection.release()
    res.json(appointments)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments", error: error.message })
  }
}

// Create appointment
exports.createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, reason, status } = req.body
    const connection = await pool.getConnection()

    await connection.query(
      "INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [patient_id, doctor_id, appointment_date, appointment_time, reason, status || "scheduled"],
    )

    connection.release()
    res.status(201).json({ message: "Appointment created successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to create appointment", error: error.message })
  }
}

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params
    const { appointment_date, appointment_time, reason, status } = req.body
    const connection = await pool.getConnection()

    await connection.query(
      "UPDATE appointments SET appointment_date = ?, appointment_time = ?, reason = ?, status = ? WHERE id = ?",
      [appointment_date, appointment_time, reason, status, id],
    )

    connection.release()
    res.json({ message: "Appointment updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to update appointment", error: error.message })
  }
}

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params
    const connection = await pool.getConnection()

    await connection.query("UPDATE appointments SET status = ? WHERE id = ?", ["cancelled", id])

    connection.release()
    res.json({ message: "Appointment cancelled successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel appointment", error: error.message })
  }
}

// Get appointments by date range
exports.getAppointmentsByDateRange = async (req, res) => {
  try {
    const { start_date, end_date } = req.query
    const connection = await pool.getConnection()

    const [appointments] = await connection.query(
      `SELECT a.*, u1.name as patient_name, u2.name as doctor_name 
       FROM appointments a 
       JOIN patients p ON a.patient_id = p.id 
       JOIN doctors d ON a.doctor_id = d.id 
       JOIN users u1 ON p.user_id = u1.id 
       JOIN users u2 ON d.user_id = u2.id 
       WHERE a.appointment_date BETWEEN ? AND ?`,
      [start_date, end_date],
    )

    connection.release()
    res.json(appointments)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments", error: error.message })
  }
}
