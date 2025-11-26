"use client"

import { useEffect, useMemo, useState } from "react"
import { billingAPI } from "../../services/api"
import { Search } from "lucide-react"

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await billingAPI.getPaymentHistory()
      const payload = Array.isArray(response.data) ? response.data : []
      setPayments(payload)
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

  const normalizedPayments = useMemo(() => {
    return payments.map((payment) => ({
      ...payment,
      patientName: payment.patientName || payment.patient || "Unknown",
      method: payment.method || payment.paymentMethod || "Online",
      amount: Number.isFinite(payment.amount) ? payment.amount : Number.parseFloat(payment.amount) || 0,
    }))
  }, [payments])

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) {
      return normalizedPayments
    }
    const query = searchQuery.trim().toLowerCase()
    return normalizedPayments.filter((payment) =>
      [payment.patientName, payment.invoiceId, payment.method]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [normalizedPayments, searchQuery])

  const hasFilteredPayments = filteredPayments.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">Search and review recorded patient transactions.</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search patient name"
              className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-foreground">Payment History</h2>
        </div>
        {hasFilteredPayments ? (
          <table className="w-full">
            <thead className="border-b border-border bg-muted/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Method</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-border transition hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold text-foreground">{payment.id}</td>
                  <td className="px-6 py-4 text-muted-foreground">{payment.invoiceId}</td>
                  <td className="px-6 py-4 text-muted-foreground">{payment.patientName}</td>
                  <td className="px-6 py-4 font-semibold text-foreground">
                    ${Number(payment.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{payment.method}</td>
                  <td className="px-6 py-4 text-muted-foreground">{payment.date}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                      {payment.status || "Completed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No patient payments found for
            {" "}
            <span className="font-semibold text-foreground">“{searchQuery.trim()}”</span>.
          </div>
        )}
      </div>
    </div>
  )
}
export default PaymentsPage