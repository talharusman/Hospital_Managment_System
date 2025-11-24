const pool = require("../config/database")

const formatStatus = (status) => {
  if (!status) return "Scheduled"
  const lower = status.toString().toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

exports.getDashboard = async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  let connection

  try {
    connection = await pool.getConnection()

    const [doctorRows] = await connection.query("SELECT id FROM doctors WHERE user_id = ? LIMIT 1", [userId])

    if (doctorRows.length === 0) {
      return res.status(404).json({ message: "Doctor profile not found" })
    }

    const doctorId = doctorRows[0].id

    const [[statsRow]] = await connection.query(
      `SELECT
        COUNT(*) AS totalAppointments,
        COUNT(DISTINCT patient_id) AS totalPatients,
        SUM(CASE WHEN appointment_date = CURDATE() THEN 1 ELSE 0 END) AS todayAppointments
      FROM appointments
      WHERE doctor_id = ?`,
      [doctorId],
    )

    const [upcomingRows] = await connection.query(
      `SELECT
        a.id,
        u.name AS patientName,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointmentDate,
        DATE_FORMAT(a.appointment_time, '%h:%i %p') AS appointmentTime,
        a.status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ?
        AND (a.appointment_date > CURDATE() OR (a.appointment_date = CURDATE() AND a.appointment_time >= CURTIME()))
      ORDER BY a.appointment_date, a.appointment_time
      LIMIT 5`,
      [doctorId],
    )

    const upcomingAppointments = upcomingRows.map((appt) => ({
      id: appt.id,
      patientName: appt.patientName,
      date: appt.appointmentDate,
      time: appt.appointmentTime,
      status: formatStatus(appt.status),
    }))

    res.json({
      totalAppointments: statsRow?.totalAppointments ?? 0,
      totalPatients: statsRow?.totalPatients ?? 0,
      todayAppointments: statsRow?.todayAppointments ?? 0,
      averageRating: null,
      upcomingAppointments,
    })
  } catch (error) {
    console.error("[doctorDashboard] Failed to get dashboard", error)
    res.status(500).json({ message: "Failed to load dashboard", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}
