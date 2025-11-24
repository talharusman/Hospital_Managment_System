"use client"

import { useState, useEffect } from "react"
import { pharmacyAPI } from "../../services/api"
import { AlertTriangle, ShoppingCart } from "lucide-react"

export const LowStockAlertsPage = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLowStockAlerts()
  }, [])

  const fetchLowStockAlerts = async () => {
    try {
      const response = await pharmacyAPI.getMedicines()
      const lowStock = response.data.filter((m) => m.quantity < 10)
      setAlerts(lowStock)
    } catch (error) {
      // Mock data
      setAlerts([
        { id: 1, name: "Aspirin", quantity: 5, minLevel: 20, category: "Pain Relief" },
        { id: 3, name: "Metformin", quantity: 8, minLevel: 15, category: "Diabetes" },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Low Stock Alerts</h1>

      {alerts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <p className="text-green-800 text-lg font-semibold">All medicines are in stock!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{alert.name}</h3>
                    <p className="text-gray-600">Category: {alert.category}</p>
                    <div className="mt-3 text-sm">
                      <p className="text-gray-700">
                        <span className="font-semibold">Current Stock:</span> {alert.quantity} units
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Minimum Level:</span> {alert.minLevel} units
                      </p>
                      <p className="text-red-600 font-semibold mt-2">
                        Short by {alert.minLevel - alert.quantity} units
                      </p>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                  <ShoppingCart size={18} /> Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default LowStockAlertsPage