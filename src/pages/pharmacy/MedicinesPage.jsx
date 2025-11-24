"use client"

import { useState, useEffect } from "react"
import { pharmacyAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Plus, Edit2, Trash2, Search } from "lucide-react"

export const MedicinesPage = () => {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    generic_name: "",
    category: "",
    dosage: "",
    quantity: "",
    price: "",
    manufacturer: "",
    expiry_date: "",
  })

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    try {
      const response = await pharmacyAPI.getMedicines()
      setMedicines(response.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load medicines")
      console.log("[v0] Error fetching medicines:", error)
      setMedicines([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await pharmacyAPI.updateMedicine(editingId, formData)
        toast.success("Medicine updated successfully")
      } else {
        await pharmacyAPI.createMedicine(formData)
        toast.success("Medicine added successfully")
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: "",
        generic_name: "",
        category: "",
        dosage: "",
        quantity: "",
        price: "",
        manufacturer: "",
        expiry_date: "",
      })
      fetchMedicines()
    } catch (error) {
      toast.error("Operation failed")
    }
  }

  const handleEdit = (medicine) => {
    setFormData(medicine)
    setEditingId(medicine.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        setMedicines(medicines.filter((m) => m.id !== id))
        toast.success("Medicine deleted")
      } catch (error) {
        toast.error("Failed to delete")
      }
    }
  }

  const filteredMedicines = medicines.filter(
    (med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.generic_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Medicine Inventory</h1>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setFormData({
              name: "",
              generic_name: "",
              category: "",
              dosage: "",
              quantity: "",
              price: "",
              manufacturer: "",
              expiry_date: "",
            })
          }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} /> Add Medicine
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by medicine name or generic name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Medicine" : "Add New Medicine"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Medicine Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Generic Name"
              value={formData.generic_name}
              onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Category</option>
              <option value="Pain Relief">Pain Relief</option>
              <option value="Fever">Fever</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Antibiotic">Antibiotic</option>
              <option value="Vitamin">Vitamin</option>
            </select>
            <input
              type="text"
              placeholder="Dosage (e.g., 500mg)"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              step="0.01"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                {editingId ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medicines Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Medicine Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Dosage</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.map((medicine) => (
              <tr key={medicine.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{medicine.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{medicine.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{medicine.dosage}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      medicine.quantity < 10 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {medicine.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">${medicine.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{medicine.expiry_date}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => handleEdit(medicine)} className="p-1 hover:bg-blue-100 text-blue-600 rounded">
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(medicine.id)}
                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default MedicinesPage