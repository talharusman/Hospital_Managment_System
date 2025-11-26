"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Calendar, DollarSign, FileText, X, Download } from "lucide-react"
import { patientAPI } from "../../services/api"
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
      console.error("[patient] Failed to load invoices", error)
      toast.error(error.response?.data?.message || "Failed to load invoices")
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const closeDetails = () => setSelectedInvoice(null)

  const triggerDownload = (filename, content) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownload = () => {
    if (!selectedInvoice) {
      toast.error("Select an invoice to download")
      return
    }

    const breakdownLines = selectedInvoice.breakdown && selectedInvoice.breakdown.length > 0
      ? selectedInvoice.breakdown.map((line, index) => `- ${line.item || `Line ${index + 1}`}: ${line.amount || ""}`)
      : ["- No breakdown available"]

    const lines = [
      `Invoice ${selectedInvoice.invoiceNumber}`,
      `Status: ${selectedInvoice.status}`,
      `Amount: ${selectedInvoice.amount}`,
      `Issued: ${selectedInvoice.date}`,
      "",
      "Breakdown:",
      ...breakdownLines,
      "",
      selectedInvoice.description ? `Summary: ${selectedInvoice.description}` : "",
    ].filter(Boolean)

    triggerDownload(`invoice-${selectedInvoice.id}.txt`, lines.join("\n"))
    toast.success("Invoice download started")
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border/50 border-t-primary"></div>
      </div>
    )
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-500/15 text-emerald-500"
      case "Pending":
        return "bg-amber-500/15 text-amber-600"
      default:
        return "bg-muted/40 text-muted-foreground"
    }
  }

  return (
    <>
      <PageContainer
        title="Invoices & billing"
        description="Track your billing history and access detailed invoice records."
        contentClassName="bg-transparent p-0 border-none shadow-none"
      >
        <div className="space-y-6">
          {invoices.length === 0 ? (
            <DashboardCard className="rounded-3xl border border-dashed border-border/60 text-center text-sm text-muted-foreground">
              No invoices available yet.
            </DashboardCard>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {invoices.map((invoice) => (
                <div key={invoice.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedInvoice(invoice)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedInvoice(invoice)
                      }
                    }}
                    className="flex h-full cursor-pointer flex-col rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{invoice.invoiceNumber}</h3>
                        <p className="text-sm text-muted-foreground">Invoice total</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>

                    <div className="mt-6 space-y-1 text-sm text-muted-foreground">
                      <p className="text-foreground text-base font-semibold">{invoice.amount}</p>
                      <p className="text-xs text-muted-foreground/80">Select to view invoice details.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeDetails}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-sm text-muted-foreground">Issued invoice</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2 text-foreground">
                <DollarSign size={16} />
                <span className="text-base font-semibold">{selectedInvoice.amount}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Calendar size={16} />
                <span>{selectedInvoice.date}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Breakdown</p>
                <div className="mt-3 space-y-3">
                  {(selectedInvoice.breakdown && selectedInvoice.breakdown.length > 0
                    ? selectedInvoice.breakdown
                    : [
                        {
                          item: "No breakdown available",
                          amount: "",
                        },
                      ]).map((lineItem, index) => (
                    <div
                      key={`${lineItem.item || "line"}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/40 p-4 text-sm text-muted-foreground"
                    >
                      <span className="text-foreground">{lineItem.item || "Item"}</span>
                      <span className="font-semibold text-foreground">{lineItem.amount || ""}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedInvoice.description && (
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground">
                    <FileText size={16} />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Summary</p>
                  </div>
                  <p className="mt-2 text-foreground">{selectedInvoice.description}</p>
                </div>
              )}

              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-foreground">
                <span className={`rounded-full px-3 py-1 ${getStatusStyle(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
              >
                <Download size={16} /> Download invoice
              </button>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default InvoicesPage
