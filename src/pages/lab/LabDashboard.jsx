"use client"

import { useState, useEffect } from "react"
import { labAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Beaker, Clock, CheckCircle, BarChart3 } from "lucide-react"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

export const LabDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recentTests, setRecentTests] = useState([])

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await labAPI.getTests()
      const pending = response.data.filter((t) => t.status === "Pending").length
      const completed = response.data.filter((t) => t.status === "Completed").length

      setStats({
        totalTests: response.data.length,
        pendingTests: pending,
        completedTests: completed,
        avgTurnaroundTime: "2 days",
      })
      setRecentTests(response.data.slice(0, 5))
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load lab tests"
      setError(errorMsg)
      toast.error(errorMsg)
      console.log("[v0] Lab Dashboard error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboard} />

  const statsData = [
    { title: "Total Tests", value: stats?.totalTests || 0, icon: Beaker, color: "blue" },
    { title: "Pending Tests", value: stats?.pendingTests || 0, icon: Clock, color: "red" },
    {
      title: "Completed Tests",
      value: stats?.completedTests || 0,
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Avg Turnaround",
      value: stats?.avgTurnaroundTime || "-",
      icon: BarChart3,
      color: "purple",
    },
  ]

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Lab Dashboard</h1>
        <p className="text-muted-foreground">Manage laboratory tests and reports</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Recent Tests Table */}
      <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Test Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Patient</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Test Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTests.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">
                      No tests found
                    </td>
                  </tr>
                ) : (
                  recentTests.map((test) => (
                    <tr key={test.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-6 py-4 text-foreground">{test.patientName}</td>
                      <td className="px-6 py-4 text-foreground">{test.testName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{test.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${test.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                        >
                          {test.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
export default LabDashboard