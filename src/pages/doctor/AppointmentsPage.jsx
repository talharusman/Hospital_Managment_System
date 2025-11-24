"use client"

import { useState, useEffect } from "react"
import { doctorAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Clock, Phone, MapPin, CheckCircle, XCircle } from "lucide-react"

export const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [filter])

  const fetchAppointments = async () => {
    try {
      const response = await doctorAPI.getAppointments({ status: filter === "all" ? null : filter })
      setAppointments(response.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load appointments")
      console.log("[v0] Error fetching doctor appointments:", error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await doctorAPI.updateAppointmentStatus(appointmentId, newStatus)
      toast.success("Appointment updated")
      fetchAppointments()
      setSelectedAppointment(null)
    } catch (error) {
      toast.error("Failed to update appointment")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const filteredAppointments =
    filter === "all" ? appointments : appointments.filter((a) => a.status.toLowerCase() === filter.toLowerCase())

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Appointments</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {["all", "scheduled", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === status
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              onClick={() => setSelectedAppointment(appt)}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer transition ${
                selectedAppointment?.id === appt.id ? "ring-2 ring-blue-500" : "hover:shadow-lg"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{appt.patientName}</h3>
                  <p className="text-gray-600 flex items-center gap-1">
                    <Phone size={14} /> {appt.patientPhone}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
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

              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Clock size={16} /> {appt.date} at {appt.time}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={16} /> Reason: {appt.reason}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Appointment Details */}
        {selectedAppointment && (
          <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Patient Name</p>
                <p className="text-gray-800 font-semibold">{selectedAppointment.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="text-gray-800 font-semibold">
                  {selectedAppointment.date} at {selectedAppointment.time}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reason for Visit</p>
                <p className="text-gray-800 font-semibold">{selectedAppointment.reason}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-800">{selectedAppointment.notes}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-gray-800 font-semibold">{selectedAppointment.status}</p>
              </div>
            </div>

            <div className="space-y-2">
              {selectedAppointment.status !== "Completed" && (
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment.id, "Completed")}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  <CheckCircle size={18} /> Mark Complete
                </button>
              )}
              {selectedAppointment.status !== "Cancelled" && (
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment.id, "Cancelled")}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  <XCircle size={18} /> Cancel Appointment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default AppointmentsPage