"use client"

import { useState, useEffect } from "react"
import { staffAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Users, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

export const StaffDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await staffAPI.getDashboard()
      const metrics = data?.metrics || {}

      setStats({
        totalPatients: metrics.totalPatients ?? 0,
        todayAppointments: metrics.todayAppointments ?? 0,
        pendingTasks: metrics.pendingTasks ?? 0,
        completedToday: metrics.completedToday ?? 0,
      })
      setAppointments(Array.isArray(data?.appointments) ? data.appointments.slice(0, 8) : [])
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load dashboard"
      setError(errorMsg)
      toast.error(errorMsg)
      console.log("[v0] Staff Dashboard error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboard} />

  const statsData = [
    { title: "Total Patients", value: stats?.totalPatients || 0, icon: Users, color: "blue" },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: "teal",
    },
    {
      title: "Pending Tasks",
      value: stats?.pendingTasks || 0,
      icon: AlertCircle,
      color: "orange",
    },
    {
      title: "Completed Today",
      value: stats?.completedToday || 0,
      icon: CheckCircle,
      color: "green",
    },
  ]

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Staff Dashboard</h1>
        <p className="text-muted-foreground">Manage daily operations and patient flow</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Appointments Schedule */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Today's Appointments Schedule</h2>
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No appointments scheduled</p>
          ) : (
            appointments.map((appt, idx) => (
              <div
                key={appt.id || idx}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition border-l-4 border-primary"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold">
                    {appt.time?.split(":")[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{appt.doctorName}</p>
                    <p className="text-sm text-muted-foreground">Patient: {appt.patientName}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                  {appt.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
export default StaffDashboard