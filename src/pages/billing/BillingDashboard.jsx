"use client"

import { useState, useEffect } from "react"
import { billingAPI } from "../../services/api"
import toast from "react-hot-toast"
import { FileText, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

export const BillingDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recentInvoices, setRecentInvoices] = useState([])

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await billingAPI.getInvoices()
      const normalizeAmount = (value) => {
        if (typeof value === "number") {
          return Number.isFinite(value) ? value : 0
        }
        const parsed = Number.parseFloat(String(value ?? "").replace(/[^0-9.-]+/g, ""))
        return Number.isFinite(parsed) ? parsed : 0
      }

      const paid = response.data.filter((invoice) => invoice.status === "Paid").length
      const pending = response.data.filter((invoice) => invoice.status === "Pending").length
      const totalAmount = response.data.reduce((sum, invoice) => sum + normalizeAmount(invoice.amount), 0)

      setStats({
        totalInvoices: response.data.length,
        paidInvoices: paid,
        pendingInvoices: pending,
        totalRevenue: `$${totalAmount.toFixed(2)}`,
      })
      setRecentInvoices(response.data.slice(0, 5))
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load invoices"
      setError(errorMsg)
      toast.error(errorMsg)
      console.log("[v0] Billing Dashboard error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboard} />

  const statsData = [
    { title: "Total Invoices", value: stats?.totalInvoices || 0, icon: FileText, color: "blue" },
    {
      title: "Paid Invoices",
      value: stats?.paidInvoices || 0,
      icon: CheckCircle,
      color: "green",
    },
    { title: "Pending Invoices", value: stats?.pendingInvoices || 0, icon: Clock, color: "red" },
    {
      title: "Total Revenue",
      value: stats?.totalRevenue || "$0",
      icon: TrendingUp,
      color: "purple",
    },
  ]

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Billing Dashboard</h1>
        <p className="text-muted-foreground">Manage invoices and payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Invoices</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Invoice ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Patient</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-6 py-4 font-semibold text-foreground">{invoice.id}</td>
                      <td className="px-6 py-4 text-foreground">{invoice.patientName}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{invoice.amount}</td>
                      <td className="px-6 py-4 text-muted-foreground">{invoice.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${invoice.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                        >
                          {invoice.status}
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
export default BillingDashboard