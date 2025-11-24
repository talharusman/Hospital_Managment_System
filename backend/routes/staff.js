const express = require("express")
const staffController = require("../controllers/staffController")
const { authMiddleware, requireRole } = require("../middleware/auth")

const router = express.Router()

router.use(authMiddleware, requireRole("staff", "admin"))

router.get("/dashboard", staffController.getDashboard)

module.exports = router
