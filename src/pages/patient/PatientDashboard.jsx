"use client"

import { useState, useEffect } from "react"
import { patientAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Calendar, FileText, Pill, DollarSign } from "lucide-react"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

export const PatientDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recentAppointments, setRecentAppointments] = useState([])

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await patientAPI.getDashboard()
      setStats(response.data)
      setRecentAppointments(response.data.recentAppointments || [])
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load dashboard"
      setError(errorMsg)
      toast.error(errorMsg)
      console.log("[v0] Patient Dashboard error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboard} />

  const statsData = [
    {
      title: "Upcoming Appointments",
      value: stats?.upcomingAppointments || 0,
      icon: Calendar,
      color: "blue",
    },
    { title: "Prescriptions", value: stats?.totalPrescriptions || 0, icon: Pill, color: "green" },
    { title: "Lab Reports", value: stats?.labReports || 0, icon: FileText, color: "purple" },
    {
      title: "Total Billed",
      value: stats?.totalBilled || "$0",
      icon: DollarSign,
      color: "orange",
    },
  ]

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Patient Dashboard</h1>
        <p className="text-muted-foreground">Your health at a glance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Appointments</h2>
            <div className="space-y-3">
              {recentAppointments.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">No recent appointments</p>
              ) : (
                recentAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {appt.doctorName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{appt.doctorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appt.date} at {appt.time}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${appt.status === "Scheduled" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                    >
                      {appt.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-lg shadow-lg p-6 border border-border h-fit">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg text-foreground hover:text-primary transition font-medium">
              <Calendar size={20} /> Book Appointment
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg text-foreground hover:text-primary transition font-medium">
              <Pill size={20} /> View Prescriptions
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg text-foreground hover:text-primary transition font-medium">
              <FileText size={20} /> Lab Reports
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg text-foreground hover:text-primary transition font-medium">
              <DollarSign size={20} /> View Invoices
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default PatientDashboard