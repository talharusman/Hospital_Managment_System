// const express = require("express")
// const patientController = require("../controllers/patientController")
// const { authMiddleware } = require("../middleware/auth")

// const router = express.Router()

// router.use(authMiddleware)

// router.get("/", patientController.getAllPatients)
// router.get("/search", patientController.searchPatients)
// router.get("/:id", patientController.getPatientById)
// router.post("/", patientController.createPatient)
// router.put("/:id", patientController.updatePatient)
// router.delete("/:id", patientController.deletePatient)

// module.exports = router


const express = require("express");
const patientController = require("../controllers/patientController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/", patientController.getAllPatients);
router.get("/search", patientController.searchPatients);
router.get("/:id", patientController.getPatientById);
router.post("/", patientController.createPatient);
router.put("/:id", patientController.updatePatient);
router.delete("/:id", patientController.deletePatient);

module.exports = router;
