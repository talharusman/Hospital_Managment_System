const pool = require("../config/database")

const normalizePaymentMethod = (method) => {
  if (!method || typeof method !== "string") {
    return "online"
  }
  return method.trim().toLowerCase().replace(/\s+/g, "_")
}

// Create invoice
exports.createInvoice = async (req, res) => {
  const { patient_id, amount, description, due_date } = req.body || {}

  if (!patient_id || amount === undefined || amount === null) {
    return res.status(400).json({ message: "Patient and amount are required" })
  }

  let connection
  try {
    connection = await pool.getConnection()

    const [result] = await connection.query(
      "INSERT INTO invoices (patient_id, amount, description, due_date, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [patient_id, amount, description || null, due_date || null, "pending"],
    )

    res.status(201).json({ message: "Invoice created successfully", invoice_id: result.insertId })
  } catch (error) {
    res.status(500).json({ message: "Failed to create invoice", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Get invoices
exports.getInvoices = async (req, res) => {
  const { patient_id } = req.query || {}

  let connection
  try {
    connection = await pool.getConnection()

    let query =
      "SELECT i.*, u.name AS patient_name FROM invoices i JOIN patients p ON i.patient_id = p.id JOIN users u ON p.user_id = u.id"
    const params = []

    if (patient_id) {
      query += " WHERE i.patient_id = ?"
      params.push(patient_id)
    }

    query += " ORDER BY i.created_at DESC"

    const [invoices] = await connection.query(query, params)
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch invoices", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Record payment
exports.recordPayment = async (req, res) => {
  const invoiceId = req.body?.invoice_id || req.body?.invoiceId
  const amountPaidInput = req.body?.amount_paid ?? req.body?.amount
  const paymentMethodInput = req.body?.payment_method || req.body?.paymentMethod

  if (!invoiceId) {
    return res.status(400).json({ message: "Invoice is required" })
  }

  let amountPaid = Number.parseFloat(amountPaidInput)
  if (Number.isNaN(amountPaid) || amountPaid <= 0) {
    amountPaid = null
  }

  const normalizedMethod = normalizePaymentMethod(paymentMethodInput)

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [[invoice]] = await connection.query(
      "SELECT id, amount, status FROM invoices WHERE id = ? FOR UPDATE",
      [invoiceId],
    )

    if (!invoice) {
      await connection.rollback()
      return res.status(404).json({ message: "Invoice not found" })
    }

    const paymentAmount = amountPaid ?? invoice.amount

    await connection.query(
      "INSERT INTO payments (invoice_id, amount_paid, payment_method, payment_date) VALUES (?, ?, ?, NOW())",
      [invoice.id, paymentAmount, normalizedMethod],
    )

    await connection.query("UPDATE invoices SET status = 'paid' WHERE id = ?", [invoice.id])

    await connection.commit()

    res.status(201).json({ message: "Payment recorded successfully" })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error("Failed to rollback payment transaction", rollbackError)
      }
    }
    res.status(500).json({ message: "Failed to record payment", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Get billing summary
exports.getBillingSummary = async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()

    const [summary] = await connection.query(
      `SELECT
        COUNT(*) AS total_invoices,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS total_pending,
        SUM(amount) AS total_amount
       FROM invoices`,
    )

    res.json(summary[0])
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch billing summary", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}

// Get payment history
exports.getPayments = async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()

    const [payments] = await connection.query(
      `SELECT pay.id,
              pay.invoice_id,
              pay.amount_paid,
              pay.payment_method,
              pay.payment_date,
              inv.patient_id,
              inv.amount      AS invoice_amount,
              u.name          AS patient_name
         FROM payments pay
         JOIN invoices inv ON pay.invoice_id = inv.id
         JOIN patients pat ON inv.patient_id = pat.id
         JOIN users u ON pat.user_id = u.id
     ORDER BY pay.payment_date DESC`,
    )

    res.json(payments)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payments", error: error.message })
  } finally {
    if (connection) connection.release()
  }
}
