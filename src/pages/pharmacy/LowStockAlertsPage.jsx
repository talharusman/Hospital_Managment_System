"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, ShoppingCart, RefreshCw } from "lucide-react"

import { pharmacyAPI } from "../../services/api"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

const DEFAULT_THRESHOLD = 10

export const LowStockAlertsPage = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [thresholdInput, setThresholdInput] = useState(String(DEFAULT_THRESHOLD))

  useEffect(() => {
    fetchLowStockAlerts()
  }, [threshold])

  const fetchLowStockAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await pharmacyAPI.getLowStock({ threshold })
      setAlerts(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load low stock alerts"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyThreshold = () => {
    const parsed = Number(thresholdInput)
    const nextValue = Number.isNaN(parsed) || parsed < 0 ? DEFAULT_THRESHOLD : parsed
    setThreshold(nextValue)
  }

  const totalShortage = useMemo(() => {
    return alerts.reduce((sum, alert) => {
      const currentQty = Number(alert.quantity) || 0
      const shortage = Math.max(threshold - currentQty, 0)
      return sum + shortage
    }, 0)
  }, [alerts, threshold])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchLowStockAlerts} />

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Low Stock Alerts</h1>
          <p className="text-muted-foreground">Monitor medicines that are close to running out of stock.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 text-sm shadow-sm">
          <label htmlFor="threshold" className="text-muted-foreground">Minimum quantity</label>
          <input
            id="threshold"
            type="number"
            min="0"
            value={thresholdInput}
            onChange={(event) => setThresholdInput(event.target.value)}
            className="w-20 rounded-lg border border-border/70 bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={handleApplyThreshold}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <RefreshCw size={14} /> Apply
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Current alerts</h2>
            <p className="text-sm text-muted-foreground">{alerts.length} medicines below {threshold} units • total shortage {totalShortage} units</p>
          </div>
          <button
            type="button"
            onClick={fetchLowStockAlerts}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
          >
            Refresh
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">All medicines meet the minimum stock level.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.map((alert) => {
            const currentQty = Number(alert.quantity) || 0
            const shortage = Math.max(threshold - currentQty, 0)
            return (
              <div key={alert.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-amber-500/15 p-3 text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{alert.name}</h3>
                        <p className="text-sm text-muted-foreground">Batch {alert.batch_number || "N/A"}</p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                      >
                        <ShoppingCart size={14} /> Order
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-xl bg-muted/40 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Current stock</p>
                        <p className="text-base font-semibold text-foreground">{currentQty}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Minimum</p>
                        <p className="text-base font-semibold text-foreground">{threshold}</p>
                      </div>
                      <div className="rounded-xl bg-amber-500/15 px-3 py-2 text-amber-600 dark:text-amber-400">
                        <p className="text-xs uppercase tracking-wide">Short by</p>
                        <p className="text-base font-semibold">{shortage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LowStockAlertsPage