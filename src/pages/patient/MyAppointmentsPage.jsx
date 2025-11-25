"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { patientAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Calendar, Clock, MapPin, Phone, X } from "lucide-react"
import { PageContainer } from "../../components/PageContainer"
import { DashboardCard } from "../../components/DashboardCard"

export const MyAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("upcoming")
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await patientAPI.getAppointments()
      setAppointments(response.data)
    } catch (error) {
      console.error("[patient] Failed to load appointments", error)
      toast.error(error.response?.data?.message || "Failed to load appointments")
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return
    }

    try {
      await patientAPI.cancelAppointment(appointmentId)
      toast.success("Appointment cancelled successfully")
      setSelectedAppointment(null)
      fetchAppointments()
    } catch (error) {
      console.error("[patient] Failed to cancel appointment", error)
      toast.error(error.response?.data?.message || "Failed to cancel appointment")
    }
  }

  const handleReschedule = (appointmentId) => {
    console.debug("[patient] Reschedule requested", appointmentId)
    setSelectedAppointment(null)
    toast.success("Redirecting to booking page")
    navigate("/patient/book-appointment", { state: { rescheduleAppointmentId: appointmentId } })
  }

  const isTodayOrFuture = (dateString) => {
    if (!dateString) return false
    const [year, month, day] = dateString.split("-").map(Number)
    if ([year, month, day].some((part) => Number.isNaN(part))) {
      return false
    }
    const appointmentDate = new Date(year, month - 1, day)
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return appointmentDate >= todayStart
  }

  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "Scheduled" && isTodayOrFuture(appointment.date)),
    [appointments],
  )
  const pastAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "Completed"),
    [appointments],
  )
  const cancelledAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "Cancelled"),
    [appointments],
  )

  const displayAppointments = useMemo(() => {
    switch (filter) {
      case "past":
        return pastAppointments
      case "cancelled":
        return cancelledAppointments
      default:
        return upcomingAppointments
    }
  }, [cancelledAppointments, filter, pastAppointments, upcomingAppointments])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border/50 border-t-primary"></div>
      </div>
    )
  }

  const tabConfig = [
    { value: "upcoming", label: `Upcoming (${upcomingAppointments.length})` },
    { value: "past", label: `Past (${pastAppointments.length})` },
    { value: "cancelled", label: `Cancelled (${cancelledAppointments.length})` },
  ]

  const getStatusStyle = (status) => {
    switch (status) {
      case "Scheduled":
        return "bg-primary/15 text-primary"
      case "Completed":
        return "bg-emerald-500/15 text-emerald-500"
      default:
        return "bg-destructive/15 text-destructive"
    }
  }

  const closeDetails = () => setSelectedAppointment(null)

  return (
    <>
      <PageContainer
        title="My appointments"
        description="Review upcoming visits, check details, and manage your bookings."
        contentClassName="bg-transparent p-0 border-none shadow-none"
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {tabConfig.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  filter === tab.value
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-muted/50 text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-40">
            {displayAppointments.length === 0 ? (
              <DashboardCard className="rounded-3xl border-dashed border border-border/60 text-center text-sm text-muted-foreground">
                No appointments found in this list.
              </DashboardCard>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {displayAppointments.map((appointment) => (
                  <div key={appointment.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAppointment(appointment)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setSelectedAppointment(appointment)
                        }
                      }}
                      className="flex h-full cursor-pointer flex-col rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{appointment.doctorName}</h3>
                          <p className="text-sm text-muted-foreground">{appointment.department}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>

                      <p className="mt-6 text-sm font-medium text-muted-foreground/80">Select to view appointment details.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeDetails}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedAppointment.doctorName}</h2>
                <p className="text-sm text-muted-foreground">{selectedAppointment.department}</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedAppointment.status)}`}
            >
              {selectedAppointment.status}
            </span>

            <div className="mt-6 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2 text-foreground">
                <Calendar size={16} />
                <span>{selectedAppointment.date}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Clock size={16} />
                <span>{selectedAppointment.time}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <MapPin size={16} />
                <span>{selectedAppointment.location}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Phone size={16} />
                <span>{selectedAppointment.phone}</span>
              </div>
            </div>

            {selectedAppointment.reason && (
              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Reason</p>
                <p className="mt-1 text-foreground">{selectedAppointment.reason}</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {selectedAppointment.status === "Scheduled" && (
                <>
                  <button
                    onClick={() => handleReschedule(selectedAppointment.id)}
                    className="rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
                  >
                    Reschedule appointment
                  </button>
                  <button
                    onClick={() => handleCancel(selectedAppointment.id)}
                    className="rounded-full border border-destructive bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/15"
                  >
                    Cancel appointment
                  </button>
                </>
              )}
              <button
                onClick={closeDetails}
                className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default MyAppointmentsPage
