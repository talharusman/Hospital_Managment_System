"use client"

import { useState, useEffect } from "react"
import { labAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Beaker, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

export const LabTechDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [testQueue, setTestQueue] = useState([])

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
      const inProgress = response.data.filter((t) => t.status === "In Progress").length

      setStats({
        totalQueue: response.data.length,
        inProgress: inProgress,
        pending: pending,
        completed: completed,
      })
      setTestQueue(response.data.filter((t) => t.status === "Pending" || t.status === "In Progress").slice(0, 10))
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load test queue"
      setError(errorMsg)
      toast.error(errorMsg)
      console.log("[v0] Lab Tech Dashboard error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboard} />

  const statsData = [
    { title: "Total in Queue", value: stats?.totalQueue || 0, icon: Beaker, color: "blue" },
    { title: "In Progress", value: stats?.inProgress || 0, icon: TrendingUp, color: "purple" },
    { title: "Pending", value: stats?.pending || 0, icon: AlertCircle, color: "orange" },
    { title: "Completed", value: stats?.completed || 0, icon: CheckCircle2, color: "green" },
  ]

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Lab Technician Dashboard</h1>
        <p className="text-muted-foreground">Process and manage lab tests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Test Queue */}
      <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Test Processing Queue</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Test ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Patient</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Test Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Priority</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {testQueue.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                      No tests in queue
                    </td>
                  </tr>
                ) : (
                  testQueue.map((test) => (
                    <tr key={test.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-6 py-4 font-semibold text-foreground">#{test.id}</td>
                      <td className="px-6 py-4 text-foreground">{test.patientName}</td>
                      <td className="px-6 py-4 text-foreground">{test.testName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700 font-medium">
                          High
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${test.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}
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
export default LabTechDashboard