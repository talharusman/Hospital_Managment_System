const express = require("express")
const appointmentController = require("../controllers/appointmentController")
const { authMiddleware } = require("../middleware/auth")

const router = express.Router()

router.use(authMiddleware)

router.get("/", appointmentController.getAllAppointments)
router.get("/range", appointmentController.getAppointmentsByDateRange)
router.post("/", appointmentController.createAppointment)
router.put("/:id", appointmentController.updateAppointment)
router.patch("/:id/cancel", appointmentController.cancelAppointment)

module.exports = router
