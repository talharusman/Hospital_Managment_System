import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
}

// Admin endpoints
export const adminAPI = {
  getUsers: () => api.get("/admin/users"),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post("/admin/users", data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDepartments: () => api.get("/admin/departments"),
  createDepartment: (data) => api.post("/admin/departments", data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  getStatistics: () => api.get("/admin/statistics"),
}

// Doctor endpoints
export const doctorAPI = {
  getDashboard: () => api.get("/doctor/dashboard"),
  getAppointments: (filters = {}) => api.get("/doctor/appointments", { params: filters }),
  getAppointmentById: (id) => api.get(`/doctor/appointments/${id}`),
  updateAppointmentStatus: (id, status) => api.put(`/doctor/appointments/${id}`, { status }),
  getPrescriptions: () => api.get("/doctor/prescriptions"),
  createPrescription: (data) => api.post("/doctor/prescriptions", data),
  getPatients: () => api.get("/doctor/patients"),
  getPatientHistory: (patientId) => api.get(`/doctor/patients/${patientId}/history`),
  getAvailability: () => api.get("/doctor/availability"),
  updateAvailability: (availability) => api.put("/doctor/availability", { availability }),
}

// Patient endpoints
export const patientAPI = {
  getDashboard: () => api.get("/patient/dashboard"),
  bookAppointment: (data) => api.post("/patient/appointments", data),
  getAppointments: () => api.get("/patient/appointments"),
  getAppointmentById: (id) => api.get(`/patient/appointments/${id}`),
  cancelAppointment: (id) => api.put(`/patient/appointments/${id}`, { status: "cancelled" }),
  rescheduleAppointment: (id, data) => api.put(`/patient/appointments/${id}`, data),
  getPrescriptions: () => api.get("/patient/prescriptions"),
  getLabReports: () => api.get("/patient/lab-reports"),
  getInvoices: () => api.get("/patient/invoices"),
  getInvoiceById: (id) => api.get(`/patient/invoices/${id}`),
}

// Lab endpoints
export const labAPI = {
  getTests: (filters = {}) => api.get("/lab/tests", { params: filters }),
  getTestById: (id) => api.get(`/lab/tests/${id}`),
  updateTestStatus: (id, status) => api.put(`/lab/tests/${id}`, { status }),
  uploadReport: (id, payload) => api.post(`/lab/tests/${id}/report`, payload),
  getLabReport: (id) => api.get(`/lab/tests/${id}/report`),
}

// Pharmacy endpoints
export const pharmacyAPI = {
  getMedicines: () => api.get("/pharmacy/medicines"),
  createMedicine: (data) => api.post("/pharmacy/medicines", data),
  updateMedicine: (id, data) => api.put(`/pharmacy/medicines/${id}`, data),
  getDispensingHistory: () => api.get("/pharmacy/dispensing-history"),
  dispenseMedicine: (data) => api.post("/pharmacy/dispense", data),
}

// Billing endpoints
export const billingAPI = {
  getInvoices: () => api.get("/billing/invoices"),
  getInvoiceById: (id) => api.get(`/billing/invoices/${id}`),
  createInvoice: (data) => api.post("/billing/invoices", data),
  processPayment: (data) => api.post("/billing/payments", data),
  getPaymentHistory: () => api.get("/billing/payments"),
}

export default api
