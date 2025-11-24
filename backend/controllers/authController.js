const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const pool = require("../config/database")

// Register User
exports.register = async (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body

    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const connection = await pool.getConnection()

    // Check if user exists
    const [existingUser] = await connection.query("SELECT id FROM users WHERE email = ?", [normalizedEmail])

    if (existingUser.length > 0) {
      connection.release()
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    await connection.query(
      "INSERT INTO users (email, password, name, role, phone, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [normalizedEmail, hashedPassword, name, role, phone || null],
    )

    connection.release()
    res.status(201).json({ message: "User registered successfully" })
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message })
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

