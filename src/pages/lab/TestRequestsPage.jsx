"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  CalendarClock,
  CheckCircle,
  ClipboardList,
  Clock as ClockIcon,
  Mail,
  Phone,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react"

import { labAPI } from "../../services/api"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

const normalizeStatus = (value) => value?.toString().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-")

const formatStatus = (status) => {
  if (!status) return "-"
  return status
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const statusTone = (status) => {
  const value = normalizeStatus(status)
  if (value === "completed") return "bg-(--status-completed-bg) text-(--status-completed-fg)"
  if (value === "pending") return "bg-(--status-pending-bg) text-(--status-pending-fg)"
  if (value === "in-progress") return "bg-(--pill-info-bg) text-(--pill-info-fg)"
  return "bg-muted text-muted-foreground"
}

const priorityTone = (priority) => {
  const value = priority?.toString().toLowerCase()
  if (value === "high") return "bg-(--action-danger) text-(--action-danger-foreground)"
  if (value === "medium") return "bg-(--pill-info-bg) text-(--pill-info-fg)"
  return "bg-muted text-muted-foreground"
}

const safeDate = (value) => {
  if (!value) return "-"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().split("T")[0]
}

export const TestRequestsPage = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("pending")
  const [search, setSearch] = useState("")
  const [selectedTestId, setSelectedTestId] = useState(null)

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = filter === "all" ? {} : { status: filter }
      const response = await labAPI.getTests(params)
      const data = Array.isArray(response.data) ? response.data : []
      setTests(data)
      setSelectedTestId((current) => {
        if (!current) return null
        return data.some((item) => item.id === current) ? current : null
      })
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load tests"
      setError(message)
      toast.error(message)
      setTests([])
      setSelectedTestId(null)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchTests()
  }, [fetchTests])

  const filteredTests = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return tests
    return tests.filter((test) => {
      const patient = test.patientName?.toLowerCase() || ""
      const testName = test.testName?.toLowerCase() || ""
      return patient.includes(term) || testName.includes(term)
    })
  }, [tests, search])

  useEffect(() => {
    if (selectedTestId && !filteredTests.some((test) => test.id === selectedTestId)) {
      setSelectedTestId(null)
    }
  }, [filteredTests, selectedTestId])

  const selectedTest = useMemo(
    () => tests.find((test) => test.id === selectedTestId) || null,
    [tests, selectedTestId],
  )

  const handleStatusUpdate = async (testId, nextStatus) => {
    try {
      const normalized = normalizeStatus(nextStatus) || "pending"
      await labAPI.updateTestStatus(testId, normalized)
      toast.success("Status updated")
      await fetchTests()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status")
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchTests} />

  const statusFilters = ["all","pending", "in-progress", "completed"]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Test Requests</h1>
          <p className="text-muted-foreground">Manage incoming laboratory requests and update their progress.</p>
        </div>
        <button
          type="button"
          onClick={fetchTests}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <button
              type="button"
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                filter === status
                  ? "border-primary/60 bg-primary text-primary-foreground shadow"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              {status === "all" ? "All" : formatStatus(status)}
            </button>
              ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by patient or test name"
          className="w-full rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 md:w-72"
        />
      </div>

      {filteredTests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
          No test requests found.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTests.map((test) => (
          <button
            type="button"
            key={test.id}
            onClick={() => setSelectedTestId(test.id)}
            className={`group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 text-left transition hover:-translate-y-0.5 hover:shadow ${
              selectedTestId === test.id ? "ring-2 ring-primary/60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--pill-info-bg) text-(--pill-info-fg)">
                    <ClipboardList size={18} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{test.testName}</h3>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Request #{test.id}</p>
                  </div>
                </div>

                <div className="mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserRound size={14} className="text-muted-foreground/80" />
                    <span>{test.patientName}</span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground/70">Patient ID {test.patientId}</p>
                </div>

                {test.patientEmail && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} className="text-muted-foreground/80" />
                    <span>{test.patientEmail}</span>
                  </div>
                )}
                {test.patientPhone && (
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} className="text-muted-foreground/80" />
                    <span>{test.patientPhone}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone(test.status)}`}>
                  {formatStatus(test.status)}
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${priorityTone(test.priority)}`}>
                  {test.priority || "Normal"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-2 text-sm text-muted-foreground/90">
              <p className="flex items-center gap-2">
                <CalendarClock size={14} className="text-muted-foreground/80" />
                <span>
                  Requested: <span className="text-foreground font-semibold">{safeDate(test.date)}</span>
                </span>
              </p>
              {test.doctorName && (
                <p className="text-muted-foreground">
                  Referred by <span className="text-foreground font-semibold">{test.doctorName}</span>
                </p>
              )}
            </div>

            {test.details && (
              <div className="mt-6 rounded-xl bg-muted/20 p-4 text-sm text-muted-foreground/90">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Notes</p>
                <p className="mt-1 text-foreground/90">{test.details}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedTestId && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelectedTestId(null)}>
          <div
            className="w-full max-w-3xl rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-(--pill-info-bg) text-(--pill-info-fg)">
                    <ClipboardList size={22} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{selectedTest.testName}</h2>
                    <p className="text-sm text-muted-foreground">Request #{selectedTest.id}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground/90">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 uppercase tracking-wide">
                    <UserRound size={14} /> {selectedTest.patientName}
                  </span>
                  {selectedTest.patientEmail && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm font-medium text-muted-foreground">
                      <Mail size={14} /> {selectedTest.patientEmail}
                    </span>
                  )}
                  {selectedTest.patientPhone && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm font-medium text-muted-foreground">
                      <Phone size={14} /> {selectedTest.patientPhone}
                    </span>
                  )}
                  {selectedTest.doctorName && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm font-medium text-muted-foreground">
                      Referred by {selectedTest.doctorName}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTestId(null)}
                className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted/40"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Status</p>
                <span className={`mt-2 inline-flex w-fit items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone(selectedTest.status)}`}>
                  {formatStatus(selectedTest.status)}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Priority</p>
                <span className={`mt-2 inline-flex w-fit items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${priorityTone(selectedTest.priority)}`}>
                  {selectedTest.priority || "Normal"}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Requested</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{safeDate(selectedTest.date)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/15 p-5 text-sm text-muted-foreground/90">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarClock size={18} /> Activity
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground/70">Requested</p>
                  <p className="text-foreground font-medium">{safeDate(selectedTest.date)}</p>
                </div>
                {selectedTest.reportDate && (
                  <div>
                    <p className="text-muted-foreground/70">Completed</p>
                    <p className="text-foreground font-medium">{safeDate(selectedTest.reportDate)}</p>
                  </div>
                )}
              </div>
              {selectedTest.details && (
                <div className="mt-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-foreground/90">{selectedTest.details}</p>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {normalizeStatus(selectedTest.status) !== "in-progress" && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedTest.id, "in-progress")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--pill-info-bg) px-4 py-2 text-(--pill-info-fg) transition hover:opacity-90"
                >
                  <ClockIcon size={18} /> Mark In Progress
                </button>
              )}
              {normalizeStatus(selectedTest.status) !== "completed" && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedTest.id, "completed")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--action-success) px-4 py-2 text-(--action-success-foreground) transition hover:bg-(--action-success-hover)"
                >
                  <CheckCircle size={18} /> Mark Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestRequestsPage