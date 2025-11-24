const pool = require("../config/database")

// Get all patients
exports.getAllPatients = async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    const [patients] = await connection.query(
      `SELECT p.id,
              p.user_id,
              u.name,
              u.email,
              p.date_of_birth,
              p.gender,
              p.blood_type,
              p.phone,
              p.address,
              p.emergency_contact
         FROM patients p
         JOIN users u ON p.user_id = u.id
     ORDER BY u.name ASC`,
    )

    res.json(patients)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch patients", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Get patient by ID
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params
    const connection = await pool.getConnection()

    const [patients] = await connection.query(
      "SELECT p.*, u.name, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?",
      [id],
    )

    if (patients.length === 0) {
      connection.release()
      return res.status(404).json({ message: "Patient not found" })
    }

    connection.release()
    res.json(patients[0])
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch patient", error: error.message })
  }
}

// // Create patient
// exports.createPatient = async (req, res) => {
//   try {
//     console.log("REQ BODY:", req.body);
//     const { user_id, date_of_birth, gender, blood_type, phone, address, emergency_contact } = req.body
//     const connection = await pool.getConnection()

//     await connection.query(
//       "INSERT INTO patients (user_id, date_of_birth, gender, blood_type, phone, address, emergency_contact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
//       [user_id, date_of_birth, gender, blood_type, phone, address, emergency_contact],
//     )

//     connection.release()
//     res.status(201).json({ message: "Patient created successfully" })
//   } catch (error) {
//     res.status(500).json({ message: "Failed to create patient", error: error.message })
//   }
// }



exports.createPatient = async (req, res) => {
  try {
    const { dob, gender, phone, address } = req.body;
    const user_id = req.user?.id; // ✅ Extract from verified JWT

    console.log("Decoded Token:", req.user);
    console.log("Extracted user_id:", user_id);

    if (!user_id) {
      return res.status(400).json({ message: "User ID not found in token" });
    }

    const connection = await pool.getConnection();

    await connection.query(
      "INSERT INTO patients (user_id, date_of_birth, gender, phone, address, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [user_id, dob, gender, phone, address]
    );

    connection.release();
    res.status(201).json({ message: "Patient created successfully" });
  } catch (error) {
    console.error("Error creating patient:", error);
    res.status(500).json({ message: "Failed to create patient", error: error.message });
  }
};


// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params
    const { date_of_birth, gender, blood_type, phone, address, emergency_contact } = req.body
    const connection = await pool.getConnection()

    await connection.query(
      "UPDATE patients SET date_of_birth = ?, gender = ?, blood_type = ?, phone = ?, address = ?, emergency_contact = ? WHERE id = ?",
      [date_of_birth, gender, blood_type, phone, address, emergency_contact, id],
    )

    connection.release()
    res.json({ message: "Patient updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to update patient", error: error.message })
  }
}

// Delete patient
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params
    const connection = await pool.getConnection()

    await connection.query("DELETE FROM patients WHERE id = ?", [id])

    connection.release()
    res.json({ message: "Patient deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete patient", error: error.message })
  }
}

// Search patients
exports.searchPatients = async (req, res) => {
  try {
    const { name, id, department, date } = req.query
    const connection = await pool.getConnection()

    let query = "SELECT p.*, u.name, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE 1=1"
    const params = []

    if (name) {
      query += " AND u.name LIKE ?"
      params.push(`%${name}%`)
    }
    if (id) {
      query += " AND p.id = ?"
      params.push(id)
    }

    const [results] = await connection.query(query, params)
    connection.release()
    res.json(results)
  } catch (error) {
    res.status(500).json({ message: "Search failed", error: error.message })
  }
}
