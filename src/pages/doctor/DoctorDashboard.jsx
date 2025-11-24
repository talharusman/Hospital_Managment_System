"use client"

import { Calendar } from "@/components/ui/calendar"

import { useState, useEffect } from "react"
import { doctorAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Clock, Stethoscope, Star, Users } from "lucide-react"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

export const DoctorDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])

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

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Manage appointments and patient care</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="text-primary" size={24} />
          Upcoming Appointments
        </h2>
        <div className="space-y-3">
          {upcomingAppointments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No upcoming appointments</p>
          ) : (
            upcomingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
                    {appt.patientName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{appt.patientName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock size={14} /> {appt.time}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">
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
export default DoctorDashboard