"use client"

import { useState, useEffect } from "react"
import { adminAPI } from "../../services/api"
import toast from "react-hot-toast"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Users, Stethoscope, Calendar, TrendingUp } from "lucide-react"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getStatistics()
      setStats(response.data)
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load statistics"
      setError(errorMsg)
      toast.error(errorMsg)
      console.log("[v0] Stats API error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchStats} />

  const statsData = [
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "blue" },
    {
      title: "Total Patients",
      value: stats?.totalPatients || 0,
      icon: Stethoscope,
      color: "teal",
    },
    { title: "Total Doctors", value: stats?.totalDoctors || 0, icon: Users, color: "purple" },
    {
      title: "Appointments",
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      color: "orange",
    },
  ]

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Trend */}
        <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary" size={24} />
            Appointments Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="appointments"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: "var(--primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution */}
        <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="text-accent" size={24} />
            User Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: "Patients", value: stats?.totalPatients || 0 },
                { name: "Doctors", value: stats?.totalDoctors || 0 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
              <Bar dataKey="value" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
export default AdminDashboard