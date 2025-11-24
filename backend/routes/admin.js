const express = require("express")
const { authMiddleware, requireRole } = require("../middleware/auth")
const adminController = require("../controllers/adminController")

const router = express.Router()

// Make statistics public (no auth) so dashboard can load even if token is missing
router.get("/statistics", adminController.getStatistics)

// Everything else remains admin-only
router.use(authMiddleware, requireRole("admin"))

router.get("/users", adminController.getUsers)
router.get("/users/:id", adminController.getUserById)
router.post("/users", adminController.createUser)
router.put("/users/:id", adminController.updateUser)
router.delete("/users/:id", adminController.deleteUser)

router.get("/departments", adminController.getDepartments)
router.get("/departments/:id", adminController.getDepartmentById)
router.post("/departments", adminController.createDepartment)
router.put("/departments/:id", adminController.updateDepartment)
router.delete("/departments/:id", adminController.deleteDepartment)

module.exports = router
