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
      const tests = Array.isArray(response.data) ? response.data : []
      const pending = tests.filter((t) => t.status?.toLowerCase() === "pending").length
      const completed = tests.filter((t) => t.status?.toLowerCase() === "completed").length

      setStats({
        totalTests: tests.length,
        pendingTests: pending,
        completedTests: completed,
        avgTurnaroundTime: "2 days",
      })
      setRecentTests(tests.slice(0, 5))
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

  const formatStatus = (status) => {
    if (!status) return "-"
    return status
      .toString()
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const statusTone = (status) => {
    const value = status?.toLowerCase()
    if (value === "completed") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    if (value === "pending") return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
    if (value === "in-progress") return "bg-primary/15 text-primary"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-foreground">Lab Dashboard</h1>
        <p className="text-muted-foreground">Manage laboratory tests and reports</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Recent Test Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Patient</th>
                  <th className="px-6 py-3 font-semibold">Test Name</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
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
                    <tr key={test.id} className="border-b border-border/60 transition hover:bg-muted/40">
                      <td className="px-6 py-4 text-foreground">{test.patientName}</td>
                      <td className="px-6 py-4 text-foreground">{test.testName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{test.date}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(test.status)}`}>
                          {formatStatus(test.status)}
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