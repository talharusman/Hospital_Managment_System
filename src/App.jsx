import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { Toaster } from "react-hot-toast"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { AdminLayout } from "./layouts/AdminLayout"
import { AdminDashboard } from "./pages/admin/AdminDashboard"
import { ManageUsersPage } from "./pages/admin/ManageUsersPage"
import { ManageDepartmentsPage } from "./pages/admin/ManageDepartmentsPage"
import { AdminReportsPage } from "./pages/admin/AdminReportsPage"
import { DoctorLayout } from "./layouts/DoctorLayout"
import { DoctorDashboard } from "./pages/doctor/DoctorDashboard"
import { AppointmentsPage } from "./pages/doctor/AppointmentsPage"
import { PrescriptionsPage as DoctorPrescriptionsPage } from "./pages/doctor/PrescriptionsPage"
import { AvailabilityPage } from "./pages/doctor/AvailabilityPage"
import { PatientsPage } from "./pages/doctor/PatientsPage"
import { PatientLayout } from "./layouts/PatientLayout"
import { PatientDashboard } from "./pages/patient/PatientDashboard"
import { BookAppointmentPage } from "./pages/patient/BookAppointmentPage"
import { MyAppointmentsPage } from "./pages/patient/MyAppointmentsPage"
import { PrescriptionsPage } from "./pages/patient/PrescriptionsPage"
import { LabReportsPage } from "./pages/patient/LabReportsPage"
import { InvoicesPage } from "./pages/patient/InvoicesPage"
import { LabLayout } from "./layouts/LabLayout"
import { LabDashboard } from "./pages/lab/LabDashboard"
import { TestRequestsPage } from "./pages/lab/TestRequestsPage"
import { UploadReportsPage } from "./pages/lab/UploadReportsPage"
import { CompletedReportsPage } from "./pages/lab/CompletedReportsPage"
import { PatientRecordsPage } from "./pages/lab/PatientRecordsPage"
import { PharmacyLayout } from "./layouts/PharmacyLayout"
import { PharmacyDashboard } from "./pages/pharmacy/PharmacyDashboard"
import { MedicinesPage } from "./pages/pharmacy/MedicinesPage"
import { DispensingPage } from "./pages/pharmacy/DispensingPage"
import { LowStockAlertsPage } from "./pages/pharmacy/LowStockAlertsPage"
import { BillingLayout } from "./layouts/BillingLayout"
import { BillingDashboard } from "./pages/billing/BillingDashboard"
import { InvoicesListPage } from "./pages/billing/InvoicesListPage"
import { CreateInvoicePage } from "./pages/billing/CreateInvoicePage"
import { PaymentsPage } from "./pages/billing/PaymentsPage"
import { StaffLayout } from "./layouts/StaffLayout"
import { StaffDashboard } from "./pages/staff/StaffDashboard"
import { StaffAppointments } from "./pages/staff/StaffAppointments"
import { StaffPatients } from "./pages/staff/StaffPatients"
import { LabTechLayout } from "./layouts/LabTechLayout"
import { LabTechDashboard } from "./pages/lab-tach/LabTechDashboard"

// Auth Pages
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage"
import { UnauthorizedPage } from "./pages/UnauthorizedPage"

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsersPage />} />
            <Route path="departments" element={<ManageDepartmentsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="billing/dashboard" element={<BillingDashboard />} />
            <Route path="billing/invoices" element={<InvoicesListPage />} />
            <Route path="billing/create" element={<CreateInvoicePage />} />
            <Route path="billing/payments" element={<PaymentsPage />} />
          </Route>

          {/* Doctor Routes */}
          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
          </Route>

          {/* Patient Routes */}
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="book-appointment" element={<BookAppointmentPage />} />
            <Route path="appointments" element={<MyAppointmentsPage />} />
            <Route path="prescriptions" element={<PrescriptionsPage />} />
            <Route path="lab-reports" element={<LabReportsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
          </Route>

          {/* Lab Routes */}
          <Route
            path="/lab/*"
            element={
              <ProtectedRoute allowedRoles={["lab_technician"]}>
                <LabLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<LabDashboard />} />
            <Route path="tests" element={<TestRequestsPage />} />
            <Route path="upload-reports" element={<UploadReportsPage />} />
            <Route path="completed" element={<CompletedReportsPage />} />
            <Route path="patients" element={<PatientRecordsPage />} />
          </Route>

          {/* Pharmacy Routes */}
          <Route
            path="/pharmacy/*"
            element={
              <ProtectedRoute allowedRoles={["pharmacist"]}>
                <PharmacyLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PharmacyDashboard />} />
            <Route path="medicines" element={<MedicinesPage />} />
            <Route path="dispensing" element={<DispensingPage />} />
            <Route path="low-stock" element={<LowStockAlertsPage />} />
            <Route path="invoices" element={<InvoicesListPage />} />
            <Route path="payments" element={<PaymentsPage />} />
          </Route>

          {/* Billing Routes */}
          <Route
            path="/billing/*"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <BillingLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<BillingDashboard />} />
            <Route path="invoices" element={<InvoicesListPage />} />
            <Route path="create" element={<CreateInvoicePage />} />
            <Route path="payments" element={<PaymentsPage />} />
          </Route>

          {/* Staff Routes */}
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="appointments" element={<StaffAppointments />} />
            <Route path="patients" element={<StaffPatients />} />
            <Route path="billing/dashboard" element={<BillingDashboard />} />
            <Route path="billing/invoices" element={<InvoicesListPage />} />
            <Route path="billing/create" element={<CreateInvoicePage />} />
            <Route path="billing/payments" element={<PaymentsPage />} />
          </Route>

          {/* Lab Technician Routes */}
          <Route
            path="/lab-tech/*"
            element={
              <ProtectedRoute allowedRoles={["lab_technician"]}>
                <LabTechLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<LabTechDashboard />} />
          </Route>

          {/* Redirect to login by default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  )
}

export default App
