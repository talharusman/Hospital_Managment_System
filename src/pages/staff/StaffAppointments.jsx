"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Mail,
  NotebookPen,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  X,
  XCircle,
} from "lucide-react"
import { PageContainer } from "../../components/PageContainer"
import { DashboardCard } from "../../components/DashboardCard"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"
import { staffAPI } from "../../services/api"

const statusBadgeStyles = {
  scheduled: "bg-sky-100 text-sky-700 border border-sky-300",
  completed: "bg-emerald-100 text-emerald-700 border border-emerald-300",
  cancelled: "bg-rose-100 text-rose-700 border border-rose-300",
  "no-show": "bg-amber-100 text-amber-700 border border-amber-300",
}

const timeframeOptions = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "past", label: "Past" },
]

const defaultFilters = {
  search: "",
  status: "all",
  department: "all",
  timeframe: "all",
}

const normalizeTimeForPayload = (time) => {
  if (!time) return null
  return time.length === 5 ? `${time}:00` : time
}

const getAppointmentDateTime = (appointment) => {
  const datePart = appointment?.appointmentDate
  if (!datePart) return null
  const timePart = appointment?.appointmentTime ? appointment.appointmentTime.slice(0, 5) : "00:00"
  return new Date(`${datePart}T${timePart}`)
}

const formatDate = (value) => {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch (error) {
    return value
  }
}

const formatTime = (value) => {
  if (!value) return "—"
  const safe = value.slice(0, 5)
  try {
    return new Date(`1970-01-01T${safe}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch (error) {
    return safe
  }
}

const formatStatusLabel = (value) => {
  if (!value) return "Scheduled"
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

const describeTimeUntil = (target) => {
  if (!(target instanceof Date) || Number.isNaN(target.getTime())) return null
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes === 0) return "Starting now"
  if (diffMinutes > 0) {
    if (diffMinutes < 60) return `In ${diffMinutes} min`
    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `In ${diffHours} hr`
    const diffDays = Math.round(diffHours / 24)
    return `In ${diffDays} day${diffDays === 1 ? "" : "s"}`
  }

  const absMinutes = Math.abs(diffMinutes)
  if (absMinutes < 60) return `${absMinutes} min ago`
  const absHours = Math.round(absMinutes / 60)
  if (absHours < 24) return `${absHours} hr ago`
  const absDays = Math.round(absHours / 24)
  return `${absDays} day${absDays === 1 ? "" : "s"} ago`
}

const resolveNotesPayload = (notes) => {
  if (notes === undefined) return null
  if (typeof notes !== "string") return null
  return notes.trim()
}

export const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ ...defaultFilters })
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState("")
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "" })
  const [mutating, setMutating] = useState({ id: null, type: null })
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const themeFallbackVars = {
    "--appointment-card": "rgba(11, 19, 42, 0.08)",
    "--appointment-card-border": "rgba(11, 19, 42, 0.16)",
  }

  const fetchAppointments = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      if (!silent) {
        setError(null)
      }
      const { data } = await staffAPI.getAppointments()
      const normalized = Array.isArray(data?.appointments) ? data.appointments : []
      setAppointments(normalized)
    } catch (err) {
      const message = err.response?.data?.message || "Unable to load appointments"
      if (silent) {
        toast.error(message)
      } else {
        setError(message)
        toast.error(message)
      }
    } finally {
      if (silent) {
        setIsRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    if (!selectedAppointmentId) return
    const exists = appointments.some((appointment) => appointment.id === selectedAppointmentId)
    if (!exists) {
      setIsDialogOpen(false)
      setSelectedAppointmentId(null)
    }
  }, [appointments, selectedAppointmentId])

  const statusCounts = useMemo(() => {
    return appointments.reduce(
      (acc, appt) => {
        const statusKey = (appt.status || "scheduled").toLowerCase()
        if (acc[statusKey] !== undefined) {
          acc[statusKey] += 1
        }
        return acc
      },
      { scheduled: 0, completed: 0, cancelled: 0, "no-show": 0 },
    )
  }, [appointments])

  const departments = useMemo(() => {
    const unique = new Set()
    appointments.forEach((appt) => {
      if (appt.departmentName) unique.add(appt.departmentName)
    })
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [appointments])

  const filteredAppointments = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    return appointments.filter((appointment) => {
      const statusKey = (appointment.status || "scheduled").toLowerCase()
      if (filters.status !== "all" && filters.status !== statusKey) {
        return false
      }

      if (filters.department !== "all" && appointment.departmentName !== filters.department) {
        return false
      }

      if (filters.search) {
        const term = filters.search.trim().toLowerCase()
        if (term.length) {
          const haystack = [appointment.patientName, appointment.doctorName, appointment.reason, appointment.departmentName]
            .filter(Boolean)
            .map((value) => value.toLowerCase())
          const matches = haystack.some((value) => value.includes(term))
          if (!matches) return false
        }
      }

      const dateTime = getAppointmentDateTime(appointment)
      if (!dateTime) return true

      switch (filters.timeframe) {
        case "today": {
          const sameDay = dateTime.toDateString() === startOfToday.toDateString()
          return sameDay
        }
        case "upcoming": {
          return dateTime.getTime() >= startOfToday.getTime()
        }
        case "past": {
          return dateTime.getTime() < startOfToday.getTime()
        }
        default:
          return true
      }
    })
  }, [appointments, filters])

  const selectedAppointment = useMemo(() => {
    if (!selectedAppointmentId) return null
    return appointments.find((appointment) => appointment.id === selectedAppointmentId) || null
  }, [appointments, selectedAppointmentId])

  useEffect(() => {
    if (selectedAppointment) {
      setNoteDraft(selectedAppointment.notes || "")
      setRescheduleForm({
        date: selectedAppointment.appointmentDate ? selectedAppointment.appointmentDate.slice(0, 10) : "",
        time: selectedAppointment.appointmentTime ? selectedAppointment.appointmentTime.slice(0, 5) : "",
      })
    } else {
      setNoteDraft("")
      setRescheduleForm({ date: "", time: "" })
    }
  }, [selectedAppointment])

  const upcomingAppointments = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    return [...appointments]
      .filter((appointment) => {
        const dateTime = getAppointmentDateTime(appointment)
        if (!dateTime) return false
        return dateTime.getTime() >= startOfToday.getTime()
      })
      .sort((a, b) => {
        const dateA = getAppointmentDateTime(a)
        const dateB = getAppointmentDateTime(b)
        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0)
      })
      .slice(0, 5)
  }, [appointments])

  const statCards = [
    { title: "Scheduled", value: statusCounts.scheduled, icon: CalendarClock, color: "blue" },
    { title: "Completed", value: statusCounts.completed, icon: CheckCircle2, color: "green" },
    { title: "Cancelled", value: statusCounts.cancelled, icon: XCircle, color: "red" },
    { title: "No-Show", value: statusCounts["no-show"], icon: AlertTriangle, color: "orange" },
  ]

  const statusButtonConfig = [
    {
      status: "completed",
      label: "Mark completed",
      activeLabel: "Already completed",
      icon: CheckCircle2,
      className: "inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60",
      activeClassName: "border-emerald-400 bg-emerald-100/60 text-emerald-800",
      disabledHint: "Appointment is already marked as completed.",
    },
    {
      status: "no-show",
      label: "Mark no-show",
      activeLabel: "Marked as no-show",
      icon: AlertTriangle,
      className: "inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60",
      activeClassName: "border-amber-400 bg-amber-100/60 text-amber-800",
      disabledHint: "Appointment already flagged as no-show.",
    },
    {
      status: "cancelled",
      label: "Cancel",
      activeLabel: "Already cancelled",
      icon: XCircle,
      className: "inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60",
      activeClassName: "border-rose-400 bg-rose-100/60 text-rose-800",
      disabledHint: "Appointment already cancelled.",
    },
    {
      status: "scheduled",
      label: "Re-open",
      activeLabel: "Currently scheduled",
      icon: CalendarClock,
      className: "inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60",
      activeClassName: "border-sky-400 bg-sky-100/60 text-sky-800",
      disabledHint: "Appointment is already on the schedule.",
    },
  ]

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({ ...defaultFilters })
  }

  const handleRefresh = async () => {
    await fetchAppointments({ silent: true })
    toast.success("Appointments refreshed")
  }

  const handleExport = () => {
    if (!filteredAppointments.length) {
      toast.error("No appointments to export with the current filters")
      return
    }

    try {
      setIsExporting(true)
      const header = ["Patient", "Doctor", "Department", "Date", "Time", "Status", "Reason", "Notes"]
      const rows = filteredAppointments.map((appointment) => [
        appointment.patientName || "",
        appointment.doctorName || "",
        appointment.departmentName || "",
        appointment.appointmentDate || "",
        appointment.appointmentTime || "",
        appointment.status || "",
        appointment.reason || "",
        appointment.notes || "",
      ])

      const csvBody = [header, ...rows]
        .map((cells) =>
          cells
            .map((cell) => {
              if (cell === null || cell === undefined) return ""
              const value = String(cell)
              if (/[",\n]/.test(value)) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(","),
        )
        .join("\n")

      const blob = new Blob([`\ufeff${csvBody}`], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `staff-appointments-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Export ready")
    } catch (err) {
      toast.error("Unable to export appointments")
    } finally {
      setIsExporting(false)
    }
  }

  const handleStatusUpdate = async (appointment, nextStatus, noteValue) => {
    if (!appointment) return
    setMutating({ id: appointment.id, type: `status-${nextStatus}` })

    try {
      const { data } = await staffAPI.updateAppointmentStatus(appointment.id, {
        status: nextStatus,
        notes: resolveNotesPayload(noteValue ?? appointment.notes),
      })

      const updated = data?.appointment
      if (updated) {
        setAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        if (selectedAppointmentId === updated.id) {
          setNoteDraft(updated.notes || "")
          setRescheduleForm({
            date: updated.appointmentDate ? updated.appointmentDate.slice(0, 10) : "",
            time: updated.appointmentTime ? updated.appointmentTime.slice(0, 5) : "",
          })
        }
        toast.success(`Appointment marked as ${formatStatusLabel(updated.status)}`)
      } else {
        await fetchAppointments()
      }
    } catch (err) {
      const message = err.response?.data?.message || "Unable to update appointment"
      toast.error(message)
    } finally {
      setMutating({ id: null, type: null })
    }
  }

  const handleReschedule = async () => {
    if (!selectedAppointment) return
    if (!rescheduleForm.date || !rescheduleForm.time) {
      toast.error("Select the new date and time before rescheduling")
      return
    }

    setMutating({ id: selectedAppointment.id, type: "reschedule" })

    try {
      const payload = {
        appointmentDate: rescheduleForm.date,
        appointmentTime: normalizeTimeForPayload(rescheduleForm.time),
        notes: resolveNotesPayload(noteDraft),
      }

      const { data } = await staffAPI.rescheduleAppointment(selectedAppointment.id, payload)
      const updated = data?.appointment

      if (updated) {
        setAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        if (selectedAppointmentId === updated.id) {
          setNoteDraft(updated.notes || "")
          setRescheduleForm({
            date: updated.appointmentDate ? updated.appointmentDate.slice(0, 10) : "",
            time: updated.appointmentTime ? updated.appointmentTime.slice(0, 5) : "",
          })
        }
        toast.success("Appointment rescheduled")
      } else {
        await fetchAppointments()
      }
    } catch (err) {
      const message = err.response?.data?.message || "Unable to reschedule appointment"
      toast.error(message)
    } finally {
      setMutating({ id: null, type: null })
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchAppointments} />

  const openAppointmentDialog = (appointmentId) => {
    setSelectedAppointmentId(appointmentId)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setTimeout(() => {
      setSelectedAppointmentId(null)
    }, 200)
  }

  return (
    <div style={themeFallbackVars}>
      <PageContainer
      title="Appointments"
      description="Coordinate arrivals, handle last-minute changes, and keep the queue moving."
      contentClassName="space-y-6 bg-transparent border-none shadow-none p-0"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <DashboardCard className="bg-card/70 backdrop-blur-sm" title="Queue controls">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Search
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  value={filters.search}
                  onChange={(event) => handleFilterChange("search", event.target.value)}
                  placeholder="Patient, doctor, or reason"
                  className="w-full rounded-xl border border-border/70 bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-sm outline-none ring-offset-background transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
              <select
                value={filters.status}
                onChange={(event) => handleFilterChange("status", event.target.value)}
                className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-offset-background transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No-show</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Department
              <select
                value={filters.department}
                onChange={(event) => handleFilterChange("department", event.target.value)}
                className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-offset-background transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Timeframe
              <select
                value={filters.timeframe}
                onChange={(event) => handleFilterChange("timeframe", event.target.value)}
                className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-offset-background transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                {timeframeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 hover:border-primary/40"
            >
              Clear filters
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> {isRefreshing ? "Refreshing" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400 bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 hover:bg-emerald-500/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      </DashboardCard>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <DashboardCard className="bg-card/70 backdrop-blur-sm" title="Appointment queue">
          {filteredAppointments.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 px-6 text-sm text-muted-foreground">
              No appointments match the selected filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {filteredAppointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => openAppointmentDialog(appointment.id)}
                  className="group flex h-full flex-col justify-between rounded-3xl border border-(--appointment-card-border) bg-(--appointment-card) p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_18px_48px_rgba(11,19,42,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</p>
                      <p className="text-lg font-semibold text-foreground">{appointment.patientName || "—"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Doctor</p>
                      <p className="text-sm font-medium text-foreground/90">{appointment.doctorName || "—"}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <span className="text-xs font-semibold text-primary/80 transition group-hover:text-primary">Open details →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DashboardCard>

        <div className="space-y-6">
          <DashboardCard className="bg-card/70 backdrop-blur-sm" title="Up next">
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
            ) : (
              <ul className="space-y-4">
                {upcomingAppointments.map((appointment) => {
                  const dateTime = getAppointmentDateTime(appointment)
                  const statusKey = (appointment.status || "scheduled").toLowerCase()
                  const badgeClass = statusBadgeStyles[statusKey] || statusBadgeStyles.scheduled

                  return (
                    <li key={`up-next-${appointment.id}`} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{appointment.patientName}</p>
                          <p className="text-xs text-muted-foreground">with {appointment.doctorName}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${badgeClass}`}>
                          {formatStatusLabel(appointment.status)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(appointment.appointmentDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" /> {formatTime(appointment.appointmentTime)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-foreground/80">
                          {describeTimeUntil(dateTime)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </DashboardCard>

        </div>
      </section>

      {isDialogOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={closeDialog}>
          <div
            className="relative w-full max-w-3xl rounded-3xl border border-border/60 bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Appointment details</p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">{selectedAppointment.patientName}</h2>
                <p className="text-sm text-muted-foreground">with {selectedAppointment.doctorName}</p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</p>
                  <div className="space-y-2 text-sm text-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 font-semibold text-primary">
                      <UserRound className="h-4 w-4" /> {selectedAppointment.patientName}
                    </span>
                    {selectedAppointment.patientEmail && (
                      <a
                        href={`mailto:${selectedAppointment.patientEmail}`}
                        className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <Mail className="h-3.5 w-3.5" /> {selectedAppointment.patientEmail}
                      </a>
                    )}
                    {selectedAppointment.patientPhone && (
                      <a
                        href={`tel:${selectedAppointment.patientPhone}`}
                        className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <Phone className="h-3.5 w-3.5" /> {selectedAppointment.patientPhone}
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Doctor</p>
                  <div className="space-y-2 text-sm text-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 font-semibold text-foreground">
                      <UserRound className="h-4 w-4" /> {selectedAppointment.doctorName}
                    </span>
                    {selectedAppointment.doctorEmail && (
                      <a
                        href={`mailto:${selectedAppointment.doctorEmail}`}
                        className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <Mail className="h-3.5 w-3.5" /> {selectedAppointment.doctorEmail}
                      </a>
                    )}
                    {selectedAppointment.doctorSpecialization && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
                        {selectedAppointment.doctorSpecialization}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl border border-dashed border-border/60 bg-background/90 p-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{formatDate(selectedAppointment.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{formatTime(selectedAppointment.appointmentTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <span>{formatStatusLabel(selectedAppointment.status)} · {selectedAppointment.departmentName || "Unassigned"}</span>
                  </div>
                  {selectedAppointment.reason && (
                    <div className="flex items-start gap-2">
                      <NotebookPen className="mt-0.5 h-4 w-4 text-primary" />
                      <span className="text-foreground/80">{selectedAppointment.reason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5 rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internal notes</p>
                    <span className="text-xs text-muted-foreground/80">Staff only</span>
                  </div>
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={4}
                    placeholder="Add arrival prep, follow-ups, or reminders."
                    className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none ring-offset-background transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reschedule</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                      Date
                      <input
                        type="date"
                        value={rescheduleForm.date}
                        onChange={(event) => setRescheduleForm((prev) => ({ ...prev, date: event.target.value }))}
                        className="rounded-lg border border-border bg-background/70 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                      Time
                      <input
                        type="time"
                        value={rescheduleForm.time}
                        onChange={(event) => setRescheduleForm((prev) => ({ ...prev, time: event.target.value }))}
                        className="rounded-lg border border-border bg-background/70 px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleReschedule}
                    disabled={mutating.id === selectedAppointment.id && mutating.type === "reschedule"}
                    className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CalendarClock className="h-4 w-4" />
                    {mutating.id === selectedAppointment.id && mutating.type === "reschedule" ? "Saving" : "Apply reschedule"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {statusButtonConfig.map(({ status, label, activeLabel, icon: Icon, className, activeClassName, disabledHint }) => {
                    const isMutating = mutating.id === selectedAppointment.id && mutating.type === `status-${status}`
                    const isActive = selectedAppointment.status === status
                    const buttonLabel = isMutating ? "Saving" : isActive ? activeLabel : label
                    const title = isActive ? disabledHint : undefined

                    return (
                      <button
                        key={`status-${status}`}
                        type="button"
                        onClick={() => !isActive && handleStatusUpdate(selectedAppointment, status, noteDraft)}
                        disabled={isMutating || isActive}
                        title={title}
                        aria-disabled={isMutating || isActive ? "true" : undefined}
                        className={`${className} ${isActive ? activeClassName : ""} ${isMutating ? "opacity-60" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                        {buttonLabel}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </PageContainer>
    </div>
  )
}

export default StaffAppointments
