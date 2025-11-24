const express = require("express")
const doctorController = require("../controllers/doctorController")
const { authMiddleware } = require("../middleware/auth")

const router = express.Router()

router.use(authMiddleware)

router.get("/", doctorController.getAllDoctors)
router.get("/:id", doctorController.getDoctorById)
router.get("/department/:department_id", doctorController.getDoctorsByDepartment)
router.post("/", doctorController.createDoctor)
router.put("/:id", doctorController.updateDoctor)

module.exports = router
