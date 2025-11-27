const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const pool = require("../config/database")

// Register User (patients only)
exports.register = async (req, res) => {
  let connection
  let transactionStarted = false
  try {
    const { email, password, name, phone, role: attemptedRole, patientProfile } = req.body
    console.log("Register payload:", req.body)

    const normalizeString = (value) => {
      if (value === undefined || value === null) return null
      const trimmed = String(value).trim()
      return trimmed.length > 0 ? trimmed : null
    }

    const normalizedEmail = normalizeString(email)?.toLowerCase()
    const normalizedPassword = typeof password === "string" ? password : null
    const normalizedName = normalizeString(name)
    if (!normalizedEmail || !normalizedPassword || !normalizedName) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    if (attemptedRole && attemptedRole !== "patient") {
      return res.status(403).json({ message: "Self-registration is limited to patients" })
    }
    const normalizedPhone = normalizeString(phone)

    connection = await pool.getConnection()
    await connection.beginTransaction()
    transactionStarted = true

    const [existingUser] = await connection.query("SELECT id FROM users WHERE email = ?", [normalizedEmail])
    if (existingUser.length > 0) {
      await connection.rollback()
      transactionStarted = false
      return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [userInsert] = await connection.query(
      "INSERT INTO users (email, password, name, role, phone, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [normalizedEmail, hashedPassword, normalizedName, "patient", normalizedPhone],
    )

    const userId = userInsert.insertId
    const profile = typeof patientProfile === "object" && patientProfile !== null ? patientProfile : {}

    const patientRecord = {
      date_of_birth: normalizeString(profile.date_of_birth),
      gender: normalizeString(profile.gender),
      phone: normalizeString(profile.phone) || normalizedPhone,
      address: normalizeString(profile.address),
      emergency_contact: normalizeString(profile.emergency_contact),
      blood_type: normalizeString(profile.blood_type),
    }

    await connection.query(
      `INSERT INTO patients (user_id, date_of_birth, gender, phone, address, emergency_contact, blood_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        patientRecord.date_of_birth,
        patientRecord.gender,
        patientRecord.phone,
        patientRecord.address,
        patientRecord.emergency_contact,
        patientRecord.blood_type,
      ],
    )

    await connection.commit()
    transactionStarted = false
    res.status(201).json({ message: "Patient registered successfully" })
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback()
    }
    res.status(500).json({ message: "Registration failed", error: error.message })
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const connection = await pool.getConnection()

    const [users] = await connection.query("SELECT * FROM users WHERE email = ?", [normalizedEmail])

    if (users.length === 0) {
      connection.release()
      return res.status(401).json({ message: "User not exist!" })
    }
    
    const user = users[0]
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      connection.release()
      return res.status(401).json({ message: "Invalid password!" })
    }
    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {

      expiresIn: process.env.JWT_EXPIRE,
      
    })

    connection.release()
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    console.log("Login error:", error); // <-- this will show the actual error in your terminal
    res.status(500).json({ message: "Login failed! from backend", error: error.message })
  }
}

