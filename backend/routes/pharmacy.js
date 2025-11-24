const express = require("express")
const pharmacyController = require("../controllers/pharmacyController")
const { authMiddleware, requireRole } = require("../middleware/auth")

const router = express.Router()

router.use(authMiddleware, requireRole("pharmacist", "admin"))

router.get("/", pharmacyController.getAllMedicines)
router.get("/low-stock", pharmacyController.getLowStockMedicines)
router.get("/dispensing-history", pharmacyController.getDispensingHistory)
router.get("/prescriptions", pharmacyController.getPrescriptionOptions)
router.post("/", pharmacyController.addMedicine)
router.put("/:id", pharmacyController.updateMedicine)
router.delete("/:id", pharmacyController.deleteMedicine)
router.post("/dispense", pharmacyController.dispenseMedicine)

module.exports = router
