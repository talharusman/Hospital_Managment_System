"use client"

import { useState, useEffect } from "react"
import { patientAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Calendar, Clock, MapPin, Phone } from "lucide-react"

export const MyAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("upcoming")

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await patientAPI.getAppointments()
      setAppointments(response.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load appointments")
      console.log("[v0] Error fetching appointments:", error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (appointmentId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await patientAPI.cancelAppointment(appointmentId)
        toast.success("Appointment cancelled successfully")
        fetchAppointments()
      } catch (error) {
        toast.error("Failed to cancel appointment")
      }
    }
  }

  const handleReschedule = async (appointmentId) => {
    toast.info("Redirect to booking page to reschedule")
    // In production, this would redirect to booking page with pre-filled data
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const upcomingAppointments = appointments.filter((a) => a.status === "Scheduled")
  const pastAppointments = appointments.filter((a) => a.status === "Completed")
  const cancelledAppointments = appointments.filter((a) => a.status === "Cancelled")

  const displayAppointments =
    filter === "upcoming" ? upcomingAppointments : filter === "past" ? pastAppointments : cancelledAppointments

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Appointments</h1>

      {/* Filter Tabs */}
      <div className="mb-8 flex gap-2">
        {[
          { value: "upcoming", label: `Upcoming (${upcomingAppointments.length})` },
          { value: "past", label: `Past (${pastAppointments.length})` },
          { value: "cancelled", label: `Cancelled (${cancelledAppointments.length})` },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === tab.value
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {displayAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No appointments found</p>
          </div>
        ) : (
          displayAppointments.map((appt) => (
            <div key={appt.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{appt.doctorName}</h3>
                  <p className="text-gray-600">{appt.department}</p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full font-semibold text-sm ${
                    appt.status === "Scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : appt.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {appt.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={18} /> {appt.date}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={18} /> {appt.time}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={18} /> {appt.location}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={18} /> {appt.phone}
                </div>
              </div>

              {appt.status === "Scheduled" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReschedule(appt.id)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleCancel(appt.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
export default MyAppointmentsPage