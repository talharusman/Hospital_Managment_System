"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Pill, AlertTriangle, DollarSign, TrendingDown } from "lucide-react"

import { pharmacyAPI } from "../../services/api"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value ?? 0)

export const PharmacyDashboard = () => {
  const [medicines, setMedicines] = useState([])
  const [history, setHistory] = useState([])
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
      const [medicineResponse, lowStockResponse, dispensingResponse] = await Promise.allSettled([
        pharmacyAPI.getMedicines(),
        pharmacyAPI.getLowStock({ threshold: 10 }),
        pharmacyAPI.getDispensingHistory(),
      ])

      if (medicineResponse.status === "fulfilled") {
        setMedicines(Array.isArray(medicineResponse.value.data) ? medicineResponse.value.data : [])
      } else {
        throw medicineResponse.reason
      }

      if (lowStockResponse.status === "fulfilled") {
        setLowStockItems(Array.isArray(lowStockResponse.value.data) ? lowStockResponse.value.data : [])
      }

      if (dispensingResponse.status === "fulfilled") {
        setHistory(Array.isArray(dispensingResponse.value.data) ? dispensingResponse.value.data : [])
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load pharmacy overview"
      setError(errorMsg)
      toast.error(errorMsg)
      setMedicines([])
      setLowStockItems([])
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const totalInventoryValue = useMemo(
    () =>
      medicines.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0
        const unitPrice = Number(item.unit_price) || 0
        return sum + quantity * unitPrice
      }, 0),
    [medicines],
  )

  const dispensedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return history.filter((record) => (record.dispensed_at || "").startsWith(today)).length
  }, [history])

  const statsData = [
    { title: "Total Medicines", value: medicines.length, icon: Pill, color: "blue" },
    {
      title: "Low Stock Items",
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: lowStockItems.length > 0 ? "red" : "green",
      trend: lowStockItems.length > 0 ? "down" : "neutral",
      trendLabel: lowStockItems.length > 0 ? `${lowStockItems.length} below threshold` : "All levels stable",
    },
    {
      title: "Inventory Value",
      value: formatCurrency(totalInventoryValue),
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Dispensed Today",
      value: dispensedToday,
      icon: TrendingDown,
      color: "purple",
      trendLabel: dispensedToday > 0 ? `${dispensedToday} orders fulfilled` : "Awaiting dispensing",
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboard} />

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-foreground">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground">Monitor inventory levels and dispensing performance.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-8 rounded-2xl border border-destructive/25 bg-destructive/10 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 text-destructive" size={24} />
            <div>
              <h3 className="mb-2 text-lg font-semibold text-destructive">Low Stock Alert</h3>
              <p className="mb-3 text-sm text-destructive/80">
                {lowStockItems.length} medicine{lowStockItems.length === 1 ? " is" : "s are"} below the minimum stock level.
              </p>
              <div className="space-y-1 text-sm">
                {lowStockItems.map((item) => (
                  <p key={item.id} className="text-destructive/70">
                    • {item.name} — <span className="font-semibold text-destructive">{item.quantity}</span> units remaining
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Dispensing Activity</h2>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Latest 8 records</span>
        </div>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No dispensing history recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-border/60 text-sm">
            {history.slice(0, 8).map((record) => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-foreground">{record.medicine_name}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                    Prescription #{record.prescription_id} · Patient {record.patient_name}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
                    {record.quantity_dispensed} units
                  </span>
                  <span className="text-muted-foreground/70">
                    {new Date(record.dispensed_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PharmacyDashboard