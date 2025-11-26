"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Search, Plus, X, Loader2, Receipt, CalendarClock } from "lucide-react"

import { labAPI } from "../../services/api"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

const defaultFormState = {
  amount: "",
  description: "",
  dueDate: "",
}

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "—"
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) return "—"
  return numeric.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

const formatDateTime = (value) => {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
  } catch (error) {
    return value
  }
}

export const LabBillingPage = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formState, setFormState] = useState(defaultFormState)
  const [selectedTest, setSelectedTest] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterBilled, setFilterBilled] = useState("all")

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await labAPI.getTests({ status: "completed" })
      setTests(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load lab tests"
      toast.error(message)
      setError(message)
      setTests([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
  }

  const openBillingForm = (test) => {
    if (!test) return
    setSelectedTest(test)
    setFormState({
      amount: "",
      description: `Lab charge: ${test.testName}`,
      dueDate: "",
    })
    setShowForm(true)
  }

  const closeBillingForm = () => {
    setShowForm(false)
    setSelectedTest(null)
    setFormState(defaultFormState)
    setIsSubmitting(false)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const submitBilling = async (event) => {
    event.preventDefault()
    if (!selectedTest) return

    const parsedAmount = Number.parseFloat(formState.amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount greater than zero")
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        amount: parsedAmount,
        description: formState.description?.trim() || `Lab charge: ${selectedTest.testName}`,
        dueDate: formState.dueDate || null,
      }

      const { data } = await labAPI.addTestCharge(selectedTest.id, payload)
      toast.success(data?.message || "Lab charge added to invoice")

      if (data?.test) {
        setTests((prev) => prev.map((test) => (test.id === data.test.id ? data.test : test)))
      } else {
        fetchTests()
      }

      closeBillingForm()
    } catch (err) {
      const message = err.response?.data?.message || "Failed to add charge"
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  const filteredTests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return tests.filter((test) => {
      const matchesTerm =
        !term ||
        test.testName?.toLowerCase().includes(term) ||
        test.patientName?.toLowerCase().includes(term) ||
        `${test.patientId}`.includes(term)

      if (!matchesTerm) return false

      if (filterBilled === "billed") {
        return Number.isFinite(test.billingAmount)
      }
      if (filterBilled === "unbilled") {
        return !Number.isFinite(test.billingAmount)
      }
      return true
    })
  }, [tests, searchTerm, filterBilled])

  const totalBilled = useMemo(() => {
    return tests.reduce((sum, test) => sum + (Number.isFinite(test.billingAmount) ? test.billingAmount : 0), 0)
  }, [tests])

  const billedCount = useMemo(() => tests.filter((test) => Number.isFinite(test.billingAmount)).length, [tests])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchTests} />

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lab Billing</h1>
          <p className="text-muted-foreground">Attach completed lab work charges directly to patient invoices.</p>
        </div>
        <div className="flex flex-col items-end text-sm text-muted-foreground">
          <span>Total billed: <strong className="text-foreground">{formatCurrency(totalBilled)}</strong></span>
          <span>Billed reports: <strong className="text-foreground">{billedCount}</strong></span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by patient or test"
            className="w-full rounded-xl border border-border/60 bg-card/80 px-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setFilterBilled("all")}
            className={`rounded-full px-3 py-1.5 transition ${filterBilled === "all" ? "bg-primary text-primary-foreground" : "border border-border/60"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterBilled("billed")}
            className={`rounded-full px-3 py-1.5 transition ${filterBilled === "billed" ? "bg-primary text-primary-foreground" : "border border-border/60"}`}
          >
            Billed
          </button>
          <button
            type="button"
            onClick={() => setFilterBilled("unbilled")}
            className={`rounded-full px-3 py-1.5 transition ${filterBilled === "unbilled" ? "bg-primary text-primary-foreground" : "border border-border/60"}`}
          >
            Unbilled
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border/70 text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Test</th>
              <th className="px-6 py-3 font-medium">Patient</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Invoice</th>
              <th className="px-6 py-3 font-medium">Billed At</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {filteredTests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  No lab reports match your filters.
                </td>
              </tr>
            ) : (
              filteredTests.map((test) => {
                const hasCharge = Number.isFinite(test.billingAmount)
                return (
                  <tr key={test.id} className="text-foreground">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{test.testName}</div>
                      <div className="text-xs text-muted-foreground">Request #{test.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{test.patientName}</div>
                      <div className="text-xs text-muted-foreground">Patient ID: {test.patientId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{hasCharge ? formatCurrency(test.billingAmount) : "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {test.billingInvoiceId ? `Invoice #${test.billingInvoiceId}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {hasCharge ? formatDateTime(test.billedAt) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openBillingForm(test)}
                        className="inline-flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-primary hover:text-primary-foreground"
                      >
                        <Plus size={14} /> {hasCharge ? "Add more" : "Add charge"}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeBillingForm}>
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Add lab charge</h2>
                <p className="text-sm text-muted-foreground">
                  Patient {selectedTest.patientName} · {selectedTest.testName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeBillingForm}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form className="space-y-5" onSubmit={submitBilling}>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="charge-amount">
                  Amount
                </label>
                <div className="relative">
                  <Receipt size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input
                    id="charge-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formState.amount}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border/70 bg-background px-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="charge-description">
                  Description
                </label>
                <textarea
                  id="charge-description"
                  name="description"
                  rows={3}
                  value={formState.description}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Lab charge description"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="charge-due-date">
                  Invoice due date (optional)
                </label>
                <div className="relative">
                  <CalendarClock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input
                    id="charge-due-date"
                    name="dueDate"
                    type="date"
                    value={formState.dueDate}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-border/70 bg-background px-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeBillingForm}
                  className="rounded-xl border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {isSubmitting ? "Saving" : "Add charge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LabBillingPage
