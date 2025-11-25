"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { CalendarDays, CreditCard, Download, Search, Send, UserRound, X } from "lucide-react"

import { billingAPI } from "../../services/api"
import { DashboardCard } from "../../components/DashboardCard"

const statusTone = {
  Paid: "bg-emerald-500/15 text-emerald-500",
  Pending: "bg-amber-500/15 text-amber-500",
  Overdue: "bg-rose-500/15 text-rose-500",
}

const formatCurrency = (value) => {
  const amount = typeof value === "number" ? value : Number.parseFloat(value)
  if (Number.isNaN(amount) || !Number.isFinite(amount)) {
    return "$0.00"
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

const formatDate = (value) => {
  if (!value) return "—"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString()
}

export const InvoicesListPage = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const response = await billingAPI.getInvoices()
      const payload = Array.isArray(response.data) ? response.data : []
      setInvoices(payload)
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load invoices")
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const rawSearch = searchQuery.trim()
  const normalizedSearch = rawSearch.toLowerCase()

  const matchesSearch = useMemo(() => {
    if (!normalizedSearch) {
      return () => true
    }

    return (invoice) =>
      [
        invoice.patientName,
        invoice.id,
        invoice.description,
        invoice.status,
        invoice.dueDate,
        invoice.date,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
  }, [normalizedSearch])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const statusMatches = filter === "all" || invoice.status?.toLowerCase() === filter
      if (!statusMatches) {
        return false
      }
      return matchesSearch(invoice)
    })
  }, [filter, invoices, matchesSearch])

  const statusFilters = useMemo(() => {
    const counters = { all: 0, paid: 0, pending: 0, overdue: 0 }

    invoices.forEach((invoice) => {
      if (!matchesSearch(invoice)) {
        return
      }

      counters.all += 1
      const key = invoice.status?.toLowerCase()
      if (key === "paid" || key === "pending" || key === "overdue") {
        counters[key] = (counters[key] || 0) + 1
      }
    })

    return [
      { label: "All", value: "all", count: counters.all },
      { label: "Paid", value: "paid", count: counters.paid },
      { label: "Pending", value: "pending", count: counters.pending },
      { label: "Overdue", value: "overdue", count: counters.overdue },
    ]
  }, [invoices, matchesSearch])

  const handleSendReminder = () => {
    toast.success("Payment reminder sent successfully")
  }

  const emptyMessage = rawSearch ? `No invoices match "${rawSearch}".` : "No invoices found in this list."

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border/50 border-t-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">Review billing activity and inspect invoice details.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by patient, invoice, or note"
              className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={fetchInvoices}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-foreground"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === option.value
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-muted/50 text-foreground hover:bg-muted"
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>

      {filteredInvoices.length === 0 ? (
        <DashboardCard className="rounded-3xl border-dashed border border-border/60 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </DashboardCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredInvoices.map((invoice) => {
            const badgeClass = statusTone[invoice.status] || "bg-muted/60 text-foreground"
            return (
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Invoice #{invoice.id}</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{invoice.patientName || "Unknown"}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      {invoice.status || "Unknown"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <CreditCard size={16} />
                      <span className="text-base font-semibold text-foreground">{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <CalendarDays size={16} />
                      <span>Issued {formatDate(invoice.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <CalendarDays size={16} className="text-destructive" />
                      <span>Due {formatDate(invoice.dueDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setSelectedInvoice(null)}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Invoice #{selectedInvoice.id}</h2>
                <p className="text-sm text-muted-foreground">Issued {formatDate(selectedInvoice.date)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
                <UserRound size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Patient</p>
                  <p className="text-sm font-semibold text-foreground">{selectedInvoice.patientName || "Unknown"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
                <CreditCard size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Amount</p>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(selectedInvoice.amount)}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Status</p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  statusTone[selectedInvoice.status] || "bg-muted/60 text-foreground"
                }`}>
                  {selectedInvoice.status || "Unknown"}
                </span>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Due date</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(selectedInvoice.dueDate)}</p>
              </div>
            </div>

            {selectedInvoice.description && (
              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Description</p>
                <p className="mt-2 text-foreground">{selectedInvoice.description}</p>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Line items</p>
              {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length > 0 ? (
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={`${item.description ?? "row"}-${index}`} className="flex items-center justify-between">
                      <span>{item.description || "Item"}</span>
                      <span className="font-semibold">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(selectedInvoice.amount)}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No itemized breakdown provided.</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-foreground"
                onClick={() => toast.success("Download started")}
              >
                <Download size={16} /> Download invoice
              </button>
              {selectedInvoice.status?.toLowerCase() === "pending" && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
                  onClick={handleSendReminder}
                >
                  <Send size={16} /> Send reminder
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default InvoicesListPage