"use client"

import { useState } from "react"
import { billingAPI } from "../../services/api"
import toast from "react-hot-toast"
import { CheckCircle, Plus, Save, Trash2 } from "lucide-react"

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
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Invoice Created!</h2>
          <p className="text-muted-foreground">The invoice has been created successfully. Redirecting...</p>
        </div>
      </div>
    )
  }

  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 text-foreground">
      <h1 className="text-3xl font-semibold mb-8">Create New Invoice</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-8 shadow-sm">
          {/* Patient Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Patient ID"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                type="text"
                placeholder="Patient Name"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                required
                className="w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Invoice Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Issue Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Invoice Items</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 text-primary transition hover:text-primary/90"
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
                    className="flex-1 rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                    step="0.01"
                    required
                    className="w-32 rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition"
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
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Notes</label>
            <textarea
              placeholder="Additional notes or payment instructions"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="h-24 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            ></textarea>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="sticky top-8 h-fit rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Invoice Summary</h2>

            <div className="space-y-3 mb-6 text-sm">
              <div>
                <p className="text-muted-foreground">Patient</p>
                <p className="font-semibold text-foreground">{formData.patientName || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Issue Date</p>
                <p className="font-semibold text-foreground">{formData.date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Due Date</p>
                <p className="font-semibold text-foreground">{formData.dueDate || "-"}</p>
              </div>
            </div>

            {/* Item Summary */}
            <div className="mb-6 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {formData.items.map(
                  (item, idx) =>
                    item.description && (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.description}</span>
                        <span className="font-semibold text-foreground">
                          ${Number.parseFloat(item.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    ),
                )}
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-semibold text-foreground">Total:</span>
                <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted"
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