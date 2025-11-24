const express = require("express")
const { authMiddleware } = require("../middleware/auth")
const doctorDashboardController = require("../controllers/doctorDashboardController")
const doctorPortalController = require("../controllers/doctorPortalController")

const router = express.Router()

router.use(authMiddleware)

router.get("/dashboard", doctorDashboardController.getDashboard)
router.get("/appointments", doctorPortalController.getAppointments)
router.get("/appointments/:id", doctorPortalController.getAppointmentById)
router.put("/appointments/:id", doctorPortalController.updateAppointmentStatus)
router.get("/availability", doctorPortalController.getAvailability)
router.put("/availability", doctorPortalController.updateAvailability)
router.get("/prescriptions", doctorPortalController.getPrescriptions)
router.post("/prescriptions", doctorPortalController.createPrescription)
router.get("/patients", doctorPortalController.getPatients)
router.get("/patients/:patientId/history", doctorPortalController.getPatientHistory)

module.exports = router
