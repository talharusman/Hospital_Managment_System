const express = require("express")
const staffController = require("../controllers/staffController")
const { authMiddleware, requireRole } = require("../middleware/auth")

const router = express.Router()

router.use(authMiddleware, requireRole("staff", "admin"))

router.get("/dashboard", staffController.getDashboard)
router.get("/appointments", staffController.getAppointments)
router.put("/appointments/:id/status", staffController.updateAppointmentStatus)
router.put("/appointments/:id/reschedule", staffController.rescheduleAppointment)
router.get("/patients", staffController.getPatients)

module.exports = router
