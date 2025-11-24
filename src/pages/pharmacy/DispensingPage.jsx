"use client"

import { useState } from "react"
import { pharmacyAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Plus, Save } from "lucide-react"

export const DispensingPage = () => {
  const [showForm, setShowForm] = useState(false)
  const [dispensingHistory, setDispensingHistory] = useState([
    {
      id: 1,
      patientName: "John Doe",
      medicineName: "Aspirin",
      quantity: 10,
      date: "2024-11-22",
      dispensedBy: "Pharmacist A",
    },
    {
      id: 2,
      patientName: "Jane Smith",
      medicineName: "Paracetamol",
      quantity: 5,
      date: "2024-11-21",
      dispensedBy: "Pharmacist B",
    },
  ])
  const [formData, setFormData] = useState({
    patientId: "",
    medicineId: "",
    quantity: "",
    notes: "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await pharmacyAPI.dispenseMedicine(formData)
      toast.success("Medicine dispensed successfully")
      setShowForm(false)
      setFormData({ patientId: "", medicineId: "", quantity: "", notes: "" })
    } catch (error) {
      toast.error("Failed to dispense medicine")
    }
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dispensing</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} /> Dispense Medicine
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Dispense Medicine</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Patient ID or Name"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select
                value={formData.medicineId}
                onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Medicine</option>
                <option value="1">Aspirin 500mg</option>
                <option value="2">Paracetamol 500mg</option>
                <option value="3">Metformin 1000mg</option>
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"
            ></textarea>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                <Save size={20} /> Dispense
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dispensing History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Dispensing History</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Patient Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Dispensed By</th>
            </tr>
          </thead>
          <tbody>
            {dispensingHistory.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{item.patientName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.medicineName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.dispensedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default DispensingPage