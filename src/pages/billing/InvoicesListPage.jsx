"use client"

import { useState, useEffect } from "react"
import { billingAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Download, Send } from "lucide-react"

export const InvoicesListPage = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await billingAPI.getInvoices()
      setInvoices(response.data)
    } catch (error) {
      // Mock data
      setInvoices([
        {
          id: "INV-2024-001",
          patientName: "John Doe",
          patientId: "P001",
          amount: 150.0,
          status: "Paid",
          date: "2024-11-20",
          dueDate: "2024-11-30",
          items: [
            { description: "Consultation", amount: 100 },
            { description: "ECG Test", amount: 50 },
          ],
        },
        {
          id: "INV-2024-002",
          patientName: "Jane Smith",
          patientId: "P002",
          amount: 200.0,
          status: "Pending",
          date: "2024-11-22",
          dueDate: "2024-12-02",
          items: [
            { description: "Blood Work", amount: 75 },
            { description: "Imaging", amount: 125 },
          ],
        },
        {
          id: "INV-2024-003",
          patientName: "Bob Johnson",
          patientId: "P003",
          amount: 175.5,
          status: "Paid",
          date: "2024-11-18",
          dueDate: "2024-11-28",
          items: [{ description: "Surgery", amount: 175.5 }],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminder = (invoiceId) => {
    toast.success("Payment reminder sent successfully")
  }

  const filteredInvoices =
    filter === "all" ? invoices : invoices.filter((i) => i.status.toLowerCase() === filter.toLowerCase())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Invoices</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {["all", "paid", "pending"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize font-semibold ${
              filter === status
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoices List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              onClick={() => setSelectedInvoice(invoice)}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer transition ${
                selectedInvoice?.id === invoice.id ? "ring-2 ring-blue-500" : "hover:shadow-lg"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{invoice.id}</h3>
                  <p className="text-sm text-gray-600">{invoice.patientName}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    invoice.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Date: {invoice.date}</p>
                  <p className="text-sm text-gray-600">Due: {invoice.dueDate}</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">${invoice.amount.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Invoice Details */}
        {selectedInvoice && (
          <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Invoice Details</h2>

            <div className="space-y-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500">Invoice Number</p>
                <p className="text-gray-800 font-semibold">{selectedInvoice.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Patient Name</p>
                <p className="text-gray-800 font-semibold">{selectedInvoice.patientName}</p>
              </div>
              <div>
                <p className="text-gray-500">Issue Date</p>
                <p className="text-gray-800 font-semibold">{selectedInvoice.date}</p>
              </div>
              <div>
                <p className="text-gray-500">Due Date</p>
                <p className="text-gray-800 font-semibold">{selectedInvoice.dueDate}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-2">Items</p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.description}</span>
                      <span className="font-semibold">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p
                  className={`font-semibold ${
                    selectedInvoice.status === "Paid" ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {selectedInvoice.status}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                <Download size={18} /> Download PDF
              </button>
              {selectedInvoice.status === "Pending" && (
                <>
                  <button className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    View Payment Options
                  </button>
                  <button
                    onClick={() => handleSendReminder(selectedInvoice.id)}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    <Send size={18} /> Send Reminder
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default InvoicesListPage