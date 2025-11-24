"use client"

import { Calendar } from "@/components/ui/calendar"

import { useEffect, useMemo, useState } from "react"
import { doctorAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Clock, Stethoscope, Star, Users, CalendarClock, ArrowRight } from "lucide-react"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"
import { useAuth } from "../../hooks/useAuth"

export const DoctorDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { user } = useAuth()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }, [])

  const formattedToday = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    [],
  )

  const heroStyles = useMemo(
    () => ({
      background: "linear-gradient(135deg, var(--stat-blue-mid) 0%, var(--stat-purple-mid) 45%, var(--stat-teal-mid) 100%)",
      color: "var(--brand-palette-fg)",
      boxShadow: "0 28px 60px color-mix(in srgb, var(--primary) 18%, transparent)",
    }),
    [],
  )

  const statusTokens = useMemo(
    () => ({
      scheduled: {
        backgroundColor: "var(--status-scheduled-bg)",
        color: "var(--status-scheduled-fg)",
        borderColor: "color-mix(in srgb, var(--status-scheduled-fg) 35%, transparent)",
      },
      completed: {
        backgroundColor: "var(--status-completed-bg)",
        color: "var(--status-completed-fg)",
        borderColor: "color-mix(in srgb, var(--status-completed-fg) 35%, transparent)",
      },
      cancelled: {
        backgroundColor: "color-mix(in srgb, var(--trend-down) 18%, transparent)",
        color: "var(--trend-down)",
        borderColor: "color-mix(in srgb, var(--trend-down) 30%, transparent)",
      },
      default: {
        backgroundColor: "color-mix(in srgb, var(--muted) 25%, transparent)",
        color: "var(--muted-foreground)",
        borderColor: "color-mix(in srgb, var(--muted-foreground) 25%, transparent)",
      },
    }),
    [],
  )

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await doctorAPI.getDashboard()
      setStats(response.data)
      setUpcomingAppointments(response.data.upcomingAppointments || [])
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load dashboard"
      setError(errorMsg)
      toast.error(errorMsg)
      console.log("[v0] Doctor Dashboard error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboard} />

  const statsData = [
    {
      title: "Total Appointments",
      value: stats?.totalAppointments || 0,
      icon: Clock,
      color: "blue",
    },
    { title: "Total Patients", value: stats?.totalPatients || 0, icon: Users, color: "teal" },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Stethoscope,
      color: "green",
    },
    { title: "Average Rating", value: stats?.averageRating || 0, icon: Star, color: "yellow" },
  ]

  const nextAppointment = upcomingAppointments[0]

  return (
    <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
      <div className="space-y-8">
        <section
          className="relative overflow-hidden rounded-4xl border p-8 shadow-xl"
          style={{ ...heroStyles, borderColor: "color-mix(in srgb, var(--border) 40%, transparent)" }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent) 0%, transparent 60%)" }} />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-[color-mix(in srgb,var(--brand-palette-fg) 75%, transparent)]">
                {formattedToday}
              </p>
              <h1 className="text-4xl font-semibold leading-tight">
                {greeting}, {user?.name ? `Dr. ${user.name.split(" ")[user.name.split(" ").length - 1]}` : "Doctor"}
              </h1>
              <p className="text-sm/relaxed opacity-80">
                Review your schedule, keep track of patients, and stay ahead of upcoming visits. All insights in one
                place.
              </p>
            </div>

            <div
              className="min-w-[16rem] rounded-2xl p-5 text-sm backdrop-blur"
              style={{
                backgroundColor: "color-mix(in srgb, var(--card) 35%, transparent)",
                border: "1px solid color-mix(in srgb, var(--border) 55%, transparent)",
              }}
            >
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-75">
                <CalendarClock className="h-4 w-4" /> Next appointment
              </p>
              {nextAppointment ? (
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-lg font-semibold">{nextAppointment.patientName}</p>
                  <p className="flex items-center gap-2 text-sm opacity-85">
                    <Clock className="h-4 w-4" /> {nextAppointment.date} • {nextAppointment.time}
                  </p>
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                    style={
                      statusTokens[nextAppointment.status?.toLowerCase()]?.backgroundColor
                        ? {
                            backgroundColor:
                              statusTokens[nextAppointment.status?.toLowerCase()]?.backgroundColor,
                            color: statusTokens[nextAppointment.status?.toLowerCase()]?.color,
                            border: `1px solid ${statusTokens[nextAppointment.status?.toLowerCase()]?.borderColor}`,
                          }
                        : {
                            backgroundColor: statusTokens.default.backgroundColor,
                            color: statusTokens.default.color,
                            border: `1px solid ${statusTokens.default.borderColor}`,
                          }
                    }
                  >
                    {nextAppointment.status}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              ) : (
                <p className="mt-4 text-sm opacity-80">You're caught up for today. Enjoy the break!</p>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <section className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Upcoming appointments</h2>
                <p className="text-sm text-muted-foreground">Stay synced with today's and future patient visits.</p>
              </div>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <p className="rounded-2xl border border-border/50 bg-muted/40 py-10 text-center text-sm text-muted-foreground">
                  No upcoming appointments
                </p>
              ) : (
                upcomingAppointments.map((appt) => {
                  const statusKey = appt.status?.toLowerCase()
                  const palette = statusTokens[statusKey] || statusTokens.default
                  return (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 p-4 transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-semibold"
                          style={{
                            backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                            color: "var(--primary)",
                          }}
                        >
                          {appt.patientName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-foreground">{appt.patientName}</p>
                          <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" /> {appt.date} • {appt.time}
                          </p>
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: palette.backgroundColor,
                          color: palette.color,
                          border: `1px solid ${palette.borderColor}`,
                        }}
                      >
                        {appt.status}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm backdrop-blur">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="mx-auto"
              />
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm backdrop-blur">
              <h3 className="text-lg font-semibold text-foreground">Today at a glance</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center justify-between">
                  <span>Appointments scheduled</span>
                  <span className="font-semibold text-foreground">{stats?.todayAppointments ?? 0}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Total patients cared for</span>
                  <span className="font-semibold text-foreground">{stats?.totalPatients ?? 0}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Upcoming queue</span>
                  <span className="font-semibold text-foreground">{upcomingAppointments.length}</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
export default DoctorDashboard