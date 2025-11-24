"use client"

import { useState, useEffect } from "react"
import { patientAPI, doctorAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Calendar, Clock, FileText, Loader2 } from "lucide-react"

export const BookAppointmentPage = () => {
  const [formData, setFormData] = useState({
    doctorId: "",
    department: "",
    date: "",
    time: "",
    reason: "",
  })
  const [doctors, setDoctors] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingDoctors, setFetchingDoctors] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const response = await doctorAPI.getAppointments()
      const uniqueDoctors = Array.from(new Map(response.data.map((apt) => [apt.doctor_id, apt])).values()).map(
        (apt) => ({
          id: apt.doctor_id,
          name: apt.doctor_name || "Dr. " + apt.doctor_id,
          specialization: apt.department || "General",
        }),
      )
      setDoctors(uniqueDoctors)
    } catch (error) {
      console.log("[v0] Error fetching doctors:", error)
      toast.error("Failed to load doctors")
    } finally {
      setFetchingDoctors(false)
    }
  }

  const handleDepartmentChange = (e) => {
    setFormData({ ...formData, department: e.target.value, doctorId: "" })
  }

  const handleDateChange = (e) => {
    setFormData({ ...formData, date: e.target.value })
    // Generate mock slots - in production, fetch from backend
    const slots = []
    for (let i = 9; i < 17; i++) {
      slots.push(`${i}:00 AM`)
      if (i < 12) slots.push(`${i}:30 AM`)
      else if (i === 12) slots.push("12:30 PM")
      else slots.push(`${i - 12}:30 PM`)
    }
    setAvailableSlots(slots)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await patientAPI.bookAppointment({
        ...formData,
        doctor_id: formData.doctorId,
      })
      toast.success("Appointment booked successfully!")
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({ doctorId: "", department: "", date: "", time: "", reason: "" })
      }, 3000)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to book appointment")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Appointment Booked!</h2>
          <p className="text-gray-600 mb-4">
            Your appointment has been successfully scheduled. You will receive a confirmation email shortly.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  const filteredDoctors = formData.department
    ? doctors.filter((d) => d.specialization === formData.department)
    : doctors

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Book an Appointment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-8">
            {fetchingDoctors ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Department Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Department</label>
                  <select
                    value={formData.department}
                    onChange={handleDepartmentChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Choose a department...</option>
                    {Array.from(new Set(doctors.map((d) => d.specialization))).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Doctor</label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    required
                    disabled={!formData.department}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  >
                    <option value="">Choose a doctor...</option>
                    {filteredDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} - {doc.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar size={18} /> Select Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Time Selection */}
                {formData.date && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock size={18} /> Select Time Slot
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData({ ...formData, time: slot })}
                          className={`py-3 rounded-lg font-semibold transition ${
                            formData.time === slot
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reason for Visit */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText size={18} /> Reason for Visit
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Describe your symptoms or reason for visit..."
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.time}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
                >
                  {loading ? "Booking..." : "Book Appointment"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Appointment Info Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Summary</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Department</p>
                <p className="font-semibold text-gray-800">{formData.department || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Doctor</p>
                <p className="font-semibold text-gray-800">
                  {formData.doctorId ? doctors.find((d) => d.id == formData.doctorId)?.name : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-semibold text-gray-800">{formData.date || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-semibold text-gray-800">{formData.time || "-"}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Important</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>- Arrive 10 minutes early</li>
              <li>- Bring valid ID and insurance card</li>
              <li>- Update medical history if changed</li>
              <li>- Bring any recent reports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
export default BookAppointmentPage