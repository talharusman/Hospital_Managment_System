const bcrypt = require("bcryptjs")
const pool = require("../config/database")

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const getConnection = async () => {
  const connection = await pool.getConnection()
  return connection
}

exports.getStatistics = async (req, res) => {
  const connection = await getConnection()

  try {
    let userCounts = { totalUsers: 0, totalPatients: 0, totalDoctors: 0 }
    let appointmentCount = { totalAppointments: 0 }
    let chartRows = []

    try {
      const [rows] = await connection.query(
        `SELECT COUNT(*) AS totalUsers,
                SUM(role = 'patient') AS totalPatients,
                SUM(role = 'doctor') AS totalDoctors
         FROM users`
      )

      const stats = rows[0] || {}
      userCounts = {
        totalUsers: Number(stats.totalUsers) || 0,
        totalPatients: Number(stats.totalPatients) || 0,
        totalDoctors: Number(stats.totalDoctors) || 0,
      }
    } catch (err) {
      if (err.code !== "ER_NO_SUCH_TABLE") throw err
    }

    try {
      const [rows] = await connection.query("SELECT COUNT(*) AS totalAppointments FROM appointments")
      const stats = rows[0] || {}
      appointmentCount = {
        totalAppointments: Number(stats.totalAppointments) || 0
      }
    } catch (err) {
      if (err.code !== "ER_NO_SUCH_TABLE") throw err
    }

    try {
      const [rows] = await connection.query(`
        SELECT YEAR(appointment_date) AS y,
              MONTH(appointment_date) AS m,
              DATE_FORMAT(appointment_date, '%b') AS month,
              COUNT(*) AS appointments
        FROM appointments
        WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
        GROUP BY YEAR(appointment_date), MONTH(appointment_date), DATE_FORMAT(appointment_date, '%b')
        ORDER BY y, m
      `);
      chartRows = rows;

    } catch (err) {
      if (err.code !== "ER_NO_SUCH_TABLE") throw err
    }

    res.json({
      totalUsers: userCounts.totalUsers,
      totalPatients: userCounts.totalPatients,
      totalDoctors: userCounts.totalDoctors,
      totalAppointments: appointmentCount.totalAppointments,
      chartData: chartRows.map((row) => ({ month: row.month, appointments: Number(row.appointments) })),
    })
  } catch (error) {
    res.status(500).json({ message: `Failed to load statistics: ${error.message}`, error: error.message })
  } finally {
    connection.release()
  }
}

exports.getReports = async (req, res) => {
  let connection

  try {
    connection = await pool.getConnection()

    const appointmentStatus = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
    }

    try {
      const [statusRows] = await connection.query(
        `SELECT status, COUNT(*) AS count
           FROM appointments
       GROUP BY status`,
      )

      statusRows.forEach((row) => {
        if (row.status === "no-show") {
          appointmentStatus.noShow = toNumber(row.count)
        } else if (appointmentStatus[row.status] !== undefined) {
          appointmentStatus[row.status] = toNumber(row.count)
        }
      })
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    let totalPatients = 0
    try {
      const [[patientsRow]] = await connection.query("SELECT COUNT(*) AS totalPatients FROM patients")
      totalPatients = toNumber(patientsRow?.totalPatients)
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    let upcomingAppointments = 0
    try {
      const [[upcomingRow]] = await connection.query(
        `SELECT COUNT(*) AS upcoming
           FROM appointments
          WHERE appointment_date >= CURDATE()`,
      )
      upcomingAppointments = toNumber(upcomingRow?.upcoming)
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    let pendingInvoices = 0
    try {
      const [[invoiceRow]] = await connection.query(
        `SELECT COUNT(*) AS pendingInvoices
           FROM invoices
          WHERE status IN ('pending', 'overdue')`,
      )
      pendingInvoices = toNumber(invoiceRow?.pendingInvoices)
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    let activeLabTests = 0
    try {
      const [[labRow]] = await connection.query(
        `SELECT COUNT(*) AS activeTests
           FROM test_requests
          WHERE status IN ('pending', 'in-progress')`,
      )
      activeLabTests = toNumber(labRow?.activeTests)
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    let departmentLoad = []
    try {
      const [departmentRows] = await connection.query(
        `SELECT d.id,
                d.name              AS department,
                COUNT(s.id)          AS staffCount
           FROM departments d
      LEFT JOIN staff s ON s.department_id = d.id
       GROUP BY d.id
       ORDER BY staffCount DESC, d.name ASC`,
      )

      departmentLoad = departmentRows.map((row) => ({
        id: row.id,
        department: row.department,
        staffCount: toNumber(row.staffCount),
      }))
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    let recentPatients = []
    try {
      const [recentRows] = await connection.query(
        `SELECT p.id,
                u.name       AS name,
                u.email      AS email,
                p.created_at AS registeredAt
           FROM patients p
           JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
          LIMIT 6`,
      )

      recentPatients = recentRows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        registeredAt: row.registeredAt,
      }))
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    let outstandingInvoices = []
    try {
      const [invoiceRows] = await connection.query(
        `SELECT i.id,
                i.amount,
                i.due_date    AS dueDate,
                i.status,
                patUsers.name AS patientName
           FROM invoices i
           JOIN patients p ON p.id = i.patient_id
           JOIN users patUsers ON patUsers.id = p.user_id
          WHERE i.status IN ('pending', 'overdue')
       ORDER BY i.due_date ASC
          LIMIT 6`,
      )

      outstandingInvoices = invoiceRows.map((row) => ({
        id: row.id,
        amount: Number(row.amount) || 0,
        dueDate: row.dueDate,
        status: row.status,
        patientName: row.patientName,
      }))
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") throw error
    }

    res.json({
      appointmentStatus,
      metrics: {
        totalPatients,
        upcomingAppointments,
        pendingInvoices,
        activeLabTests,
      },
      departmentLoad,
      recentPatients,
      outstandingInvoices,
    })
  } catch (error) {
    res.status(500).json({ message: "Failed to load operational reports", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

exports.getUsers = async (req, res) => {
  const connection = await getConnection()

  try {
    const [users] = await connection.query(
      "SELECT id, name, email, role, phone, created_at AS createdAt, updated_at AS updatedAt FROM users ORDER BY created_at DESC"
    )
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: "Failed to load users", error: error.message })
  } finally {
    connection.release()
  }
}

exports.getUserById = async (req, res) => {
  const { id } = req.params
  const connection = await getConnection()

  try {
    const [rows] = await connection.query(
      "SELECT id, name, email, role, phone, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?",
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(rows[0])
  } catch (error) {
    res.status(500).json({ message: "Failed to load user", error: error.message })
  } finally {
    connection.release()
  }
}

const normalizeString = (value) => {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeEmail = (value) => {
  const normalized = normalizeString(value)
  return normalized ? normalized.toLowerCase() : null
}

const normalizeRole = (value) => {
  const normalized = normalizeString(value)
  if (!normalized) return null
  return normalized.toLowerCase().replace(/\s+/g, "_")
}

const ADMIN_ALLOWED_ROLES_FOR_CREATE = new Set(["doctor", "lab_technician", "pharmacist", "staff"])

exports.createUser = async (req, res) => {
  const { name, email, role, phone, password } = req.body

  const normalizedName = normalizeString(name)
  const normalizedEmail = normalizeEmail(email)
  const normalizedRole = normalizeRole(role)
  const normalizedPhone = normalizeString(phone)
  const normalizedPassword = typeof password === "string" ? password.trim() : ""

  if (!normalizedName || !normalizedEmail || !normalizedRole || normalizedPassword.length < 6) {
    return res.status(400).json({ message: "Name, email, role, and a password of at least 6 characters are required" })
  }

  if (!ADMIN_ALLOWED_ROLES_FOR_CREATE.has(normalizedRole)) {
    return res.status(403).json({ message: "Admins can only register doctors, lab technicians, pharmacists, or staff" })
  }

  const connection = await getConnection()

  try {
    const [existing] = await connection.query("SELECT id FROM users WHERE email = ?", [normalizedEmail])

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already in use" })
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10)

    const [result] = await connection.query(
      "INSERT INTO users (name, email, role, phone, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
      [normalizedName, normalizedEmail, normalizedRole, normalizedPhone, hashedPassword]
    )

    res.status(201).json({ id: result.insertId, message: "User created successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to create user", error: error.message })
  } finally {
    connection.release()
  }
}

exports.updateUser = async (req, res) => {
  const { id } = req.params
  const { name, email, role, phone, password } = req.body

  const connection = await getConnection()

  try {
    const [[existingUser]] = await connection.query("SELECT role FROM users WHERE id = ? LIMIT 1", [id])

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" })
    }

    const currentRole = existingUser.role

    const updates = []
    const params = []

    if (name !== undefined) {
      const normalizedName = normalizeString(name)
      if (!normalizedName) {
        return res.status(400).json({ message: "Name cannot be empty" })
      }
      updates.push("name = ?")
      params.push(normalizedName)
    }
    if (email !== undefined) {
      const normalizedEmail = normalizeEmail(email)
      if (!normalizedEmail) {
        return res.status(400).json({ message: "Invalid email" })
      }
      updates.push("email = ?")
      params.push(normalizedEmail)
    }
    if (role !== undefined) {
      const normalizedRole = normalizeRole(role)
      if (normalizedRole && normalizedRole !== currentRole) {
        return res.status(403).json({ message: "Role cannot be changed" })
      }
    }
    if (phone !== undefined) {
      updates.push("phone = ?")
      params.push(normalizeString(phone))
    }
    if (password) {
      if (typeof password !== "string" || password.trim().length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" })
      }
      const hashedPassword = await bcrypt.hash(password.trim(), 10)
      updates.push("password = ?")
      params.push(hashedPassword)
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No updates provided" })
    }

    updates.push("updated_at = NOW()")

    params.push(id)

    await connection.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params)

    res.json({ message: "User updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error: error.message })
  } finally {
    connection.release()
  }
}

exports.deleteUser = async (req, res) => {
  const { id } = req.params
  const connection = await getConnection()

  try {
    await connection.query("DELETE FROM users WHERE id = ?", [id])
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message })
  } finally {
    connection.release()
  }
}

exports.getDepartments = async (req, res) => {
  const connection = await getConnection()

  try {
    const [departments] = await connection.query(
      `SELECT d.id,
              d.name,
              d.description,
              d.head_id AS headId,
              d.created_at AS createdAt,
              d.created_at AS updatedAt,
              u.name AS headName,
              u.email AS headEmail,
              u.phone AS headPhone
       FROM departments d
       LEFT JOIN users u ON d.head_id = u.id
       ORDER BY d.created_at DESC`
    )

    res.json(departments)
  } catch (error) {
    res.status(500).json({ message: "Failed to load departments", error: error.message })
  } finally {
    connection.release()
  }
}

exports.createDepartment = async (req, res) => {
  const { name, description, headId } = req.body

  if (!name) {
    return res.status(400).json({ message: "Department name is required" })
  }

  const connection = await getConnection()

  try {
    const [result] = await connection.query(
      "INSERT INTO departments (name, description, head_id, created_at) VALUES (?, ?, ?, NOW())",
      [name, description || null, headId || null]
    )

    res.status(201).json({ id: result.insertId, message: "Department created successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to create department", error: error.message })
  } finally {
    connection.release()
  }
}

exports.updateDepartment = async (req, res) => {
  const { id } = req.params
  const { name, description, headId } = req.body

  if (!name) {
    return res.status(400).json({ message: "Department name is required" })
  }

  const connection = await getConnection()

  try {
    await connection.query("UPDATE departments SET name = ?, description = ?, head_id = ? WHERE id = ?", [name, description || null, headId || null, id])

    res.json({ message: "Department updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to update department", error: error.message })
  } finally {
    connection.release()
  }
}

exports.deleteDepartment = async (req, res) => {
  const { id } = req.params
  const connection = await getConnection()

  try {
    await connection.query("DELETE FROM departments WHERE id = ?", [id])
    res.json({ message: "Department deleted successfully" })
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      res.status(409).json({ message: "Cannot delete department that is assigned to doctors" })
    } else {
      res.status(500).json({ message: "Failed to delete department", error: error.message })
    }
  } finally {
    connection.release()
  }
}

exports.getDepartmentById = async (req, res) => {
  const { id } = req.params
  const connection = await getConnection()

  try {
    const [rows] = await connection.query(
      `SELECT d.id,
              d.name,
              d.description,
              d.head_id AS headId,
              d.created_at AS createdAt,
              d.created_at AS updatedAt,
              u.name AS headName,
              u.email AS headEmail,
              u.phone AS headPhone
       FROM departments d
       LEFT JOIN users u ON d.head_id = u.id
       WHERE d.id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Department not found" })
    }

    res.json(rows[0])
  } catch (error) {
    res.status(500).json({ message: "Failed to load department", error: error.message })
  } finally {
    connection.release()
  }
}
