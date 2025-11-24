const express = require("express")
const labController = require("../controllers/labController")
const { authMiddleware, requireRole } = require("../middleware/auth")

const router = express.Router()

router.use(authMiddleware, requireRole("lab_technician"))

router.get("/tests", labController.listTestRequests)
router.get("/tests/:id", labController.getTestRequestById)
router.post("/tests", labController.createTestRequest)
router.put("/tests/:id", labController.updateTestStatus)
router.post("/tests/:id/report", labController.uploadLabReport)
router.get("/tests/:id/report", labController.getLabReport)

module.exports = router
