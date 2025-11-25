const express = require("express")
const patientPortalController = require("../controllers/patientPortalController")
const { authMiddleware, requireRole } = require("../middleware/auth")

const router = express.Router()

router.use(authMiddleware, requireRole("patient"))

router.get("/dashboard", patientPortalController.getDashboard)
router.get("/appointments", patientPortalController.getAppointments)
router.get("/appointments/:id", patientPortalController.getAppointmentById)
router.post("/appointments", patientPortalController.bookAppointment)
router.patch("/appointments/:id/cancel", patientPortalController.cancelAppointment)
router.get("/doctors", patientPortalController.getDoctors)
router.get("/doctors/:id/availability", patientPortalController.getDoctorAvailability)
router.get("/prescriptions", patientPortalController.getPrescriptions)
router.get("/lab-reports", patientPortalController.getLabReports)
router.get("/invoices", patientPortalController.getInvoices)
router.get("/invoices/:id", patientPortalController.getInvoiceById)
router.post("/invoices/:id/pay", patientPortalController.payInvoice)

module.exports = router
