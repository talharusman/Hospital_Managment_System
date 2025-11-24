"use client"

import { useState, useEffect } from "react"
import { billingAPI } from "../../services/api"
import toast from "react-hot-toast"
import { CreditCard, CheckCircle } from "lucide-react"

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    invoiceId: "",
    amount: "",
    paymentMethod: "card",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await billingAPI.getPaymentHistory()
      setPayments(response.data)
    } catch (error) {
      // Mock data
      setPayments([
        {
          id: "PAY-001",
          invoiceId: "INV-2024-001",
          patientName: "John Doe",
          amount: 150.0,
          method: "Credit Card",
          date: "2024-11-21",
          status: "Completed",
        },
        {
          id: "PAY-002",
          invoiceId: "INV-2024-003",
          patientName: "Bob Johnson",
          amount: 175.5,
          method: "Bank Transfer",
          date: "2024-11-19",
          status: "Completed",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await billingAPI.processPayment(formData)
      toast.success("Payment processed successfully")
      setShowForm(false)
      setFormData({
        invoiceId: "",
        amount: "",
        paymentMethod: "card",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
      })
      fetchPayments()
    } catch (error) {
      toast.error("Payment failed. Please try again.")
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <CreditCard size={20} /> Process Payment
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">Process Payment</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.invoiceId}
                onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Invoice</option>
                <option value="INV-2024-002">INV-2024-002 - Jane Smith - $200.00</option>
                <option value="INV-2024-004">INV-2024-004 - New Invoice</option>
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                step="0.01"
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {["card", "bank", "cash"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className={`py-3 rounded-lg font-semibold capitalize transition ${
                      formData.paymentMethod === method
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {formData.paymentMethod === "card" && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Card Number"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={formData.cvv}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                <CheckCircle size={20} /> Process Payment
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Payment ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Invoice ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Method</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-800">{payment.id}</td>
                <td className="px-6 py-4 text-gray-600">{payment.invoiceId}</td>
                <td className="px-6 py-4 text-gray-600">{payment.patientName}</td>
                <td className="px-6 py-4 font-semibold text-gray-800">${payment.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-gray-600">{payment.method}</td>
                <td className="px-6 py-4 text-gray-600">{payment.date}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default PaymentsPage