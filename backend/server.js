const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const patientRoutes = require("./routes/patients")
const appointmentRoutes = require("./routes/appointments")
const doctorRoutes = require("./routes/doctors")
const doctorPortalRoutes = require("./routes/doctorPortal")
const pharmacyRoutes = require("./routes/pharmacy")
const labRoutes = require("./routes/lab")
const billingRoutes = require("./routes/billing")
const adminRoutes = require("./routes/admin")
const patientPortalRoutes = require("./routes/patientPortal")
const staffRoutes = require("./routes/staff")

const errorHandler = require("./middleware/errorHandler")

const app = express()

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/patients", patientRoutes)
app.use("/api/appointments", appointmentRoutes)
app.use("/api/doctors", doctorRoutes)
app.use("/api/doctor", doctorPortalRoutes)
app.use("/api/pharmacy", pharmacyRoutes)
app.use("/api/lab", labRoutes)
app.use("/api/billing", billingRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/patient", patientPortalRoutes)
app.use("/api/staff", staffRoutes)

// Serve frontend build assets when available (supports client-side routing refreshes)
const staticExportPath = path.join(__dirname, "..", "out")
const legacyBuildPath = path.join(__dirname, "..", "build")
const clientStaticPath = fs.existsSync(staticExportPath) ? staticExportPath : legacyBuildPath

if (fs.existsSync(clientStaticPath)) {
  app.use(express.static(clientStaticPath))

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next()
    }

    res.sendFile(path.join(clientStaticPath, "index.html"))
  })
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" })
})

// Error handling
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`)
})
