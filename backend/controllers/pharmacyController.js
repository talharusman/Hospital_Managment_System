const pool = require("../config/database")

const parseNumber = (value, defaultValue = 0) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

// Get all medicines
exports.getAllMedicines = async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    const [medicines] = await connection.query(
      `SELECT id,
              name,
              generic_name,
              batch_number,
              expiry_date,
              quantity,
              unit_price,
              supplier_id,
              created_at,
              updated_at
         FROM medicines
     ORDER BY name ASC`,
    )

    res.json(medicines)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch medicines", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Add medicine
exports.addMedicine = async (req, res) => {
  const name = req.body.name?.trim()
  const genericName = req.body.generic_name?.trim() || null
  const batchNumber = req.body.batch_number?.trim() || null
  const expiryDate = req.body.expiry_date || null
  const quantity = parseNumber(req.body.quantity, 0)
  const unitPrice = req.body.unit_price !== undefined ? parseNumber(req.body.unit_price, null) : null
  const supplierId = req.body.supplier_id || null

  if (!name) {
    return res.status(400).json({ message: "Medicine name is required" })
  }

  let connection
  try {
    connection = await pool.getConnection()

    const [result] = await connection.query(
      `INSERT INTO medicines (name, generic_name, batch_number, expiry_date, quantity, unit_price, supplier_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, genericName, batchNumber, expiryDate, quantity, unitPrice, supplierId],
    )

    const [[insertedMedicine]] = await connection.query("SELECT * FROM medicines WHERE id = ?", [result.insertId])

    res.status(201).json({ message: "Medicine added successfully", medicine: insertedMedicine })
  } catch (error) {
    res.status(500).json({ message: "Failed to add medicine", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Update medicine
exports.updateMedicine = async (req, res) => {
  const { id } = req.params
  const name = req.body.name?.trim()
  const genericName = req.body.generic_name?.trim() || null
  const batchNumber = req.body.batch_number?.trim() || null
  const expiryDate = req.body.expiry_date || null
  const quantity = parseNumber(req.body.quantity, 0)
  const unitPrice = req.body.unit_price !== undefined ? parseNumber(req.body.unit_price, null) : null
  const supplierId = req.body.supplier_id || null

  if (!name) {
    return res.status(400).json({ message: "Medicine name is required" })
  }

  let connection
  try {
    connection = await pool.getConnection()

    const [result] = await connection.query("SELECT id FROM medicines WHERE id = ?", [id])
    if (result.length === 0) {
      return res.status(404).json({ message: "Medicine not found" })
    }

    await connection.query(
      `UPDATE medicines
          SET name = ?,
              generic_name = ?,
              batch_number = ?,
              expiry_date = ?,
              quantity = ?,
              unit_price = ?,
              supplier_id = ?,
              updated_at = NOW()
        WHERE id = ?`,
      [name, genericName, batchNumber, expiryDate, quantity, unitPrice, supplierId, id],
    )

    const [[updatedMedicine]] = await connection.query("SELECT * FROM medicines WHERE id = ?", [id])

    res.json({ message: "Medicine updated successfully", medicine: updatedMedicine })
  } catch (error) {
    res.status(500).json({ message: "Failed to update medicine", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Delete medicine
exports.deleteMedicine = async (req, res) => {
  const { id } = req.params
  let connection

  try {
    connection = await pool.getConnection()

    const [result] = await connection.query("DELETE FROM medicines WHERE id = ?", [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Medicine not found" })
    }

    res.json({ message: "Medicine deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete medicine", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Get low stock medicines
exports.getLowStockMedicines = async (req, res) => {
  const threshold = parseNumber(req.query.threshold, 10)
  let connection

  try {
    connection = await pool.getConnection()

    const [medicines] = await connection.query(
      `SELECT id,
              name,
              generic_name,
              batch_number,
              expiry_date,
              quantity,
              unit_price
         FROM medicines
        WHERE quantity <= ?
     ORDER BY quantity ASC, name ASC`,
      [threshold],
    )

    res.json(medicines)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch low stock medicines", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Record prescription dispensing
exports.dispenseMedicine = async (req, res) => {
  const prescriptionId = req.body.prescriptionId || req.body.prescription_id
  const medicineId = req.body.medicineId || req.body.medicine_id
  const quantityDispensed = parseNumber(req.body.quantity || req.body.quantity_dispensed, null)
  const dispenserId = req.user?.id || req.body.dispensed_by || null

  if (!prescriptionId || !medicineId || quantityDispensed === null) {
    return res.status(400).json({ message: "Prescription, medicine, and quantity are required" })
  }

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [[medicine]] = await connection.query(
      "SELECT id, name, quantity FROM medicines WHERE id = ? FOR UPDATE",
      [medicineId],
    )

    if (!medicine) {
      await connection.rollback()
      return res.status(404).json({ message: "Medicine not found" })
    }

    if (medicine.quantity < quantityDispensed) {
      await connection.rollback()
      return res.status(400).json({ message: "Insufficient stock for the requested quantity" })
    }

    await connection.query("UPDATE medicines SET quantity = quantity - ? WHERE id = ?", [
      quantityDispensed,
      medicineId,
    ])

    const [insertResult] = await connection.query(
      `INSERT INTO dispensing_records (prescription_id, medicine_id, quantity_dispensed, dispensed_by, dispensed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [prescriptionId, medicineId, quantityDispensed, dispenserId],
    )

    const [[record]] = await connection.query(
      `SELECT dr.id,
              dr.prescription_id,
              dr.medicine_id,
              dr.quantity_dispensed,
              dr.dispensed_at,
              m.name      AS medicine_name,
              uPharm.name AS pharmacist_name,
              pat.id      AS patient_id,
              uPat.name   AS patient_name
         FROM dispensing_records dr
         JOIN medicines m ON m.id = dr.medicine_id
    LEFT JOIN users uPharm ON uPharm.id = dr.dispensed_by
         JOIN prescriptions pr ON pr.id = dr.prescription_id
         JOIN patients pat ON pat.id = pr.patient_id
         JOIN users uPat ON uPat.id = pat.user_id
        WHERE dr.id = ?`,
      [insertResult.insertId],
    )

    await connection.commit()

    res.status(201).json({ message: "Medicine dispensed successfully", record })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error("Failed to rollback dispensing transaction", rollbackError)
      }
    }
    res.status(500).json({ message: "Failed to dispense medicine", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Fetch dispensing history
exports.getDispensingHistory = async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    const [history] = await connection.query(
      `SELECT dr.id,
              dr.prescription_id,
              dr.medicine_id,
              dr.quantity_dispensed,
              dr.dispensed_at,
              m.name       AS medicine_name,
              m.unit_price AS medicine_unit_price,
              uPharm.name  AS pharmacist_name,
              pat.id       AS patient_id,
              uPat.name    AS patient_name
         FROM dispensing_records dr
         JOIN medicines m ON m.id = dr.medicine_id
    LEFT JOIN users uPharm ON uPharm.id = dr.dispensed_by
         JOIN prescriptions pr ON pr.id = dr.prescription_id
         JOIN patients pat ON pat.id = pr.patient_id
         JOIN users uPat ON uPat.id = pat.user_id
     ORDER BY dr.dispensed_at DESC`,
    )

    res.json(history)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dispensing history", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Fetch prescription list for dispensing
exports.getPrescriptionOptions = async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    const [prescriptions] = await connection.query(
      `SELECT pr.id,
              pr.prescription_date,
              pr.status,
              pat.id     AS patient_id,
              uPat.name  AS patient_name,
              doc.id     AS doctor_id,
              uDoc.name  AS doctor_name
         FROM prescriptions pr
         JOIN patients pat ON pat.id = pr.patient_id
         JOIN users uPat ON uPat.id = pat.user_id
         JOIN doctors doc ON doc.id = pr.doctor_id
         JOIN users uDoc ON uDoc.id = doc.user_id
     ORDER BY pr.prescription_date DESC
        LIMIT 100`,
    )

    res.json(prescriptions)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch prescriptions", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}
