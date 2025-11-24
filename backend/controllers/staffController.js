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
