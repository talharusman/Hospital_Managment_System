"use client"

import { useState } from "react"
import { billingAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Plus, Save, Trash2 } from "lucide-react"

export const CreateInvoicePage = () => {
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [{ description: "", amount: "" }],
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", amount: "" }],
    })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await billingAPI.createInvoice(formData)
      toast.success("Invoice created successfully")
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          patientId: "",
          patientName: "",
          date: new Date().toISOString().split("T")[0],
          dueDate: "",
          items: [{ description: "", amount: "" }],
          notes: "",
        })
      }, 3000)
    } catch (error) {
      toast.error("Failed to create invoice")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Created!</h2>
          <p className="text-gray-600">The invoice has been created successfully. Redirecting...</p>
        </div>
      </div>
    )
  }

  const total = calculateTotal()

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Invoice</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-8">
          {/* Patient Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Patient ID"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Patient Name"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Invoice Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Issue Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Invoice Items</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
              >
                <Plus size={20} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                    step="0.01"
                    required
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <textarea
              placeholder="Additional notes or payment instructions"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"
            ></textarea>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-8 h-fit">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Invoice Summary</h2>

            <div className="space-y-3 mb-6 text-sm">
              <div>
                <p className="text-gray-500">Patient</p>
                <p className="text-gray-800 font-semibold">{formData.patientName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Issue Date</p>
                <p className="text-gray-800 font-semibold">{formData.date}</p>
              </div>
              <div>
                <p className="text-gray-500">Due Date</p>
                <p className="text-gray-800 font-semibold">{formData.dueDate || "-"}</p>
              </div>
            </div>

            {/* Item Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {formData.items.map(
                  (item, idx) =>
                    item.description && (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.description}</span>
                        <span className="font-semibold text-gray-800">
                          ${Number.parseFloat(item.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    ),
                )}
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
            >
              <Save size={20} /> {loading ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
export default CreateInvoicePage