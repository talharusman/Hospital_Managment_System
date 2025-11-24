"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { CalendarX, Clock, Phone, MapPin, CheckCircle, XCircle, X } from "lucide-react"

import { doctorAPI } from "../../services/api"

export const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [filter])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const response = await doctorAPI.getAppointments({ status: filter === "all" ? null : filter })
      setAppointments(Array.isArray(response.data) ? response.data : [])
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

  const closeDetails = () => setSelectedAppointment(null)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border/70 border-t-primary" />
      </div>
    )
  }

  const filteredAppointments =
    filter === "all"
      ? appointments
      : appointments.filter((appt) => appt.status?.toLowerCase() === filter.toLowerCase())

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-8 text-3xl font-semibold text-foreground">Appointments</h1>

      <div className="mb-6 flex gap-2">
        {["all", "scheduled", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg border px-4 py-2 capitalize transition ${
              filter === status
                ? "border-primary/60 bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 p-10 text-center">
            <CalendarX className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">No appointments found</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              There are no appointments in this view right now. Try another filter or check back later.
            </p>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <button
              key={appt.id}
              type="button"
              onClick={() => setSelectedAppointment(appt)}
              className="flex flex-col items-start gap-4 rounded-xl border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="flex w-full items-center justify-between">
                <p className="text-lg font-semibold text-foreground">{appt.patientName}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    appt.status === "Scheduled"
                      ? "bg-(--pill-info-bg) text-(--pill-info-fg)"
                      : appt.status === "Completed"
                        ? "bg-(--status-completed-bg) text-(--status-completed-fg)"
                        : "bg-(--status-cancelled-bg) text-(--status-cancelled-fg)"
                  }`}
                >
                  {appt.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={16} />
                <span>
                  {appt.date} • {appt.time}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
          onClick={closeDetails}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedAppointment.patientName}</h2>
                <p className="text-sm text-muted-foreground">Appointment details</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted/40"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/50 p-3">
                <p className="text-xs font-semibold uppercase">Date &amp; time</p>
                <p className="mt-1 text-base text-foreground">
                  {selectedAppointment.date} • {selectedAppointment.time}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 p-3">
                <p className="text-xs font-semibold uppercase">Contact</p>
                <p className="mt-1 flex items-center gap-2 text-foreground">
                  <Phone size={16} /> {selectedAppointment.patientPhone}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 p-3">
                <p className="text-xs font-semibold uppercase">Reason</p>
                <p className="mt-1 text-foreground">{selectedAppointment.reason}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3">
                <p className="text-xs font-semibold uppercase">Location / Notes</p>
                <p className="mt-1 flex items-center gap-2 text-foreground">
                  <MapPin size={16} />
                  <span>{selectedAppointment.location || "Clinic"}</span>
                </p>
                {selectedAppointment.notes && <p className="mt-2 text-sm">{selectedAppointment.notes}</p>}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                <div>
                  <p className="text-xs font-semibold uppercase">Status</p>
                  <p className="mt-1 text-foreground">{selectedAppointment.status}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    selectedAppointment.status === "Scheduled"
                      ? "bg-(--pill-info-bg) text-(--pill-info-fg)"
                      : selectedAppointment.status === "Completed"
                        ? "bg-(--status-completed-bg) text-(--status-completed-fg)"
                        : "bg-(--status-cancelled-bg) text-(--status-cancelled-fg)"
                  }`}
                >
                  {selectedAppointment.status}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {selectedAppointment.status !== "Completed" && (
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment.id, "Completed")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--action-success) px-4 py-2 text-(--action-success-foreground) transition hover:bg-(--action-success-hover)"
                >
                  <CheckCircle size={18} /> Mark Complete
                </button>
              )}
              {selectedAppointment.status !== "Cancelled" && (
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment.id, "Cancelled")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--action-danger) px-4 py-2 text-(--action-danger-foreground) transition hover:bg-(--action-danger-hover)"
                >
                  <XCircle size={18} /> Cancel Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage
