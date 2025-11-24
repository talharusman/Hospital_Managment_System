"use client"

import { useState, useEffect } from "react"
import { patientAPI } from "../../services/api"
import { Download, DollarSign } from "lucide-react"
import { toast } from "react-hot-toast"
import { PageContainer } from "../../components/PageContainer"
import { DashboardCard } from "../../components/DashboardCard"

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await patientAPI.getInvoices()
      setInvoices(response.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load invoices")
      console.log("[v0] Error fetching invoices:", error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border/50 border-t-primary"></div>
      </div>
    )
  }

  return (
    <PageContainer
      title="Invoices & Billing"
      description="Review your billing history and download payment records."
      contentClassName="bg-card/90"
      className="grid-cols-1 lg:grid-cols-[2fr_1fr]"
    >
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <DashboardCard className="border-dashed border border-border/60 text-center">
            <p className="text-sm text-muted-foreground">No invoices available yet.</p>
          </DashboardCard>
        ) : (
          invoices.map((invoice) => {
            const isSelected = selectedInvoice?.id === invoice.id
            return (
              <button
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice)}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  isSelected
                    ? "border-primary/70 bg-primary/10 shadow-md"
                    : "border-border/60 bg-card/80 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-muted-foreground">{invoice.description}</p>
                    <p className="text-xs text-muted-foreground/80">{invoice.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-foreground">{invoice.amount}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        invoice.status === "Paid"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <aside className="space-y-4 rounded-2xl border border-border/60 bg-card/85 p-5">
        {selectedInvoice ? (
          <>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Invoice details</h2>
              <p className="text-sm text-muted-foreground">
                Summary for <span className="font-medium text-foreground">{selectedInvoice.invoiceNumber}</span>
              </p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between text-foreground">
                <span className="font-medium">Amount</span>
                <span className="text-lg font-semibold">{selectedInvoice.amount}</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Issued</p>
                <p className="text-sm text-foreground">{selectedInvoice.date}</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Breakdown</p>
                <div className="space-y-2 rounded-xl border border-border/40 bg-background/80 p-3">
                  {selectedInvoice.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-foreground">
                      <span>{item.item}</span>
                      <span className="font-semibold">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Status</p>
                <p
                  className={`text-sm font-semibold ${
                    selectedInvoice.status === "Paid" ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  {selectedInvoice.status}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                <Download size={18} /> Download invoice
              </button>
              {selectedInvoice.status === "Pending" && (
                <button className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600/90">
                  <DollarSign size={18} /> Pay now
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2 text-sm text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Select an invoice</h2>
            <p>Choose an invoice from the list to review full billing details.</p>
          </div>
        )}
      </aside>
    </PageContainer>
  )
}
export default InvoicesPage