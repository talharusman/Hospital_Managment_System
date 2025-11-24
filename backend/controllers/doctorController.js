const pool = require("../config/database")

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const connection = await pool.getConnection()
    const [doctors] = await connection.query(
      "SELECT d.*, u.name, u.email, u.phone FROM doctors d JOIN users u ON d.user_id = u.id",
    )
    connection.release()
    res.json(doctors)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctors", error: error.message })
  }
}

// Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params
    const connection = await pool.getConnection()

    const [doctors] = await connection.query(
      "SELECT d.*, u.name, u.email, u.phone FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?",
      [id],
    )

    if (doctors.length === 0) {
      connection.release()
      return res.status(404).json({ message: "Doctor not found" })
    }

    connection.release()
    res.json(doctors[0])
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctor", error: error.message })
  }
}

// Create doctor
exports.createDoctor = async (req, res) => {
  try {
    const { user_id, specialization, license_number, department_id, availability } = req.body
    const connection = await pool.getConnection()

    await connection.query(
      "INSERT INTO doctors (user_id, specialization, license_number, department_id, availability, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [req.user.id, specialization, license_number, department_id, availability],
    )

    connection.release()
    res.status(201).json({ message: "Doctor created successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to create doctor", error: error.message })
  }
}

// Update doctor
exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params
    const { specialization, license_number, department_id, availability } = req.body
    const connection = await pool.getConnection()

    await connection.query(
      "UPDATE doctors SET specialization = ?, license_number = ?, department_id = ?, availability = ? WHERE id = ?",
      [specialization, license_number, department_id, availability, id],
    )

    connection.release()
    res.json({ message: "Doctor updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to update doctor", error: error.message })
  }
}

// Get doctors by department
exports.getDoctorsByDepartment = async (req, res) => {
  try {
    const { department_id } = req.params
    const connection = await pool.getConnection()

    const [doctors] = await connection.query(
      "SELECT d.*, u.name, u.email FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.department_id = ?",
      [department_id],
    )

    connection.release()
    res.json(doctors)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctors", error: error.message })
  }
}
