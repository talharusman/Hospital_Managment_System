"use client"

import { useState, useEffect } from "react"
import { pharmacyAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Pill, AlertTriangle, DollarSign, TrendingUp } from "lucide-react"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

export const PharmacyDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lowStockItems, setLowStockItems] = useState([])

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await pharmacyAPI.getMedicines()
      const lowStock = response.data.filter((m) => m.quantity < 10)

      setStats({
        totalMedicines: response.data.length,
        lowStockCount: lowStock.length,
        totalValue: "$45,230.00",
        dispensedToday: 23,
      })
      setLowStockItems(lowStock)
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load medicines"
      setError(errorMsg)
      toast.error(errorMsg)
      console.log("[v0] Pharmacy Dashboard error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboard} />

  const statsData = [
    { title: "Total Medicines", value: stats?.totalMedicines || 0, icon: Pill, color: "blue" },
    {
      title: "Low Stock Items",
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: "red",
    },
    {
      title: "Inventory Value",
      value: stats?.totalValue || "$0",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Dispensed Today",
      value: stats?.dispensedToday || 0,
      icon: TrendingUp,
      color: "purple",
    },
  ]

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground">Manage inventory and dispensing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-destructive flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-2">Low Stock Alert</h3>
              <p className="text-destructive/80 text-sm mb-3">
                {lowStockItems.length} medicine(s) below minimum stock level
              </p>
              <div className="space-y-1">
                {lowStockItems.map((item) => (
                  <p key={item.id} className="text-sm text-destructive/70">
                    • {item.name} - {item.quantity} units remaining
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Dispensing Activity</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-4 border-b border-border hover:bg-muted/30 rounded transition">
            <div>
              <p className="font-semibold text-foreground">Aspirin 500mg</p>
              <p className="text-muted-foreground">Dispensed to Ward A</p>
            </div>
            <span className="font-semibold text-foreground">10 units</span>
          </div>
          <div className="flex justify-between items-center p-4 border-b border-border hover:bg-muted/30 rounded transition">
            <div>
              <p className="font-semibold text-foreground">Paracetamol 500mg</p>
              <p className="text-muted-foreground">Dispensed to Patient ID: P123</p>
            </div>
            <span className="font-semibold text-foreground">2 units</span>
          </div>
          <div className="flex justify-between items-center p-4 hover:bg-muted/30 rounded transition">
            <div>
              <p className="font-semibold text-foreground">Metformin 1000mg</p>
              <p className="text-muted-foreground">Dispensed to Clinic B</p>
            </div>
            <span className="font-semibold text-foreground">5 units</span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default PharmacyDashboard