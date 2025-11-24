const express = require("express")
const billingController = require("../controllers/billingController")
const { authMiddleware } = require("../middleware/auth")

const router = express.Router()

router.use(authMiddleware)

router.get("/", billingController.getInvoices)
router.get("/summary", billingController.getBillingSummary)
router.get("/payments", billingController.getPayments)
router.post("/invoice", billingController.createInvoice)
router.post("/payment", billingController.recordPayment)

module.exports = router
