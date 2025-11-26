const express = require("express")
const billingController = require("../controllers/billingController")
const { authMiddleware } = require("../middleware/auth")

const router = express.Router()

router.use(authMiddleware)

// Invoice routes
router.get("/", billingController.getInvoices)
router.get("/invoices", billingController.getInvoices)
router.get("/invoices/:id", billingController.getInvoiceById)
router.post("/invoices", billingController.createInvoice)
router.patch("/invoices/:id", billingController.updateInvoice)

// Payment routes
router.get("/payments", billingController.getPayments)
router.post("/payments", billingController.recordPayment)

// Summary route
router.get("/summary", billingController.getBillingSummary)

// Legacy fallbacks
router.post("/invoice", billingController.createInvoice)
router.post("/payment", billingController.recordPayment)

module.exports = router
