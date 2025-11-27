"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarClock, Download, FileText, Mail, Phone, RefreshCw, UserRound, X } from "lucide-react"
import toast from "react-hot-toast"

import { labAPI } from "../../services/api"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/api$/, "")

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
  if (value === "completed") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
  if (value === "pending") return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
  if (value === "in-progress") return "bg-primary/15 text-primary"
  return "bg-muted text-muted-foreground"
}

const safeDate = (value) => {
  if (!value) return "-"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().split("T")[0]
}

const parseReportPayload = (value) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === "object" ? parsed : { raw: value }
  } catch (error) {
    return { raw: value }
  }
}

export const CompletedReportsPage = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [selectedReportId, setSelectedReportId] = useState(null)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await labAPI.getTests({ status: "completed" })
      const data = Array.isArray(response.data) ? response.data : []
      setReports(data)
      setSelectedReportId((current) => {
        if (!current) return null
        return data.some((report) => report.id === current) ? current : null
      })
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load completed reports"
      setError(message)
      toast.error(message)
      setReports([])
      setSelectedReportId(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return reports
    return reports.filter((item) => {
      const patient = item.patientName?.toLowerCase() || ""
      const test = item.testName?.toLowerCase() || ""
      return patient.includes(term) || test.includes(term)
    })
  }, [reports, search])

  useEffect(() => {
    if (selectedReportId && !filteredReports.some((report) => report.id === selectedReportId)) {
      setSelectedReportId(null)
    }
  }, [filteredReports, selectedReportId])

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) || null,
    [reports, selectedReportId],
  )

  const detailPayload = useMemo(() => parseReportPayload(selectedReport?.reportData), [selectedReport?.reportData])

  const handleDownload = async (testId) => {
    try {
      const matching = reports.find((item) => item.id === testId)
      if (!matching?.reportFilePath) {
        toast.error("No file available for this report")
        return
      }

      const { data } = await labAPI.getLabReport(testId)
      if (!data?.reportFilePath) {
        toast.error("No file available for this report")
        return
      }

      if (!/^https?:/i.test(data.reportFilePath) && !data.reportFilePath.includes("/")) {
        toast.error("Stored file reference is not a downloadable path")
        return
      }

      const href = /^https?:/i.test(data.reportFilePath)
        ? data.reportFilePath
        : `${API_ORIGIN}${data.reportFilePath.startsWith("/") ? "" : "/"}${data.reportFilePath}`
      window.open(href, "_blank")
    } catch (err) {
      const message = err.response?.data?.message || "Unable to download report"
      toast.error(message)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchReports} />

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Completed Reports</h1>
          <p className="text-muted-foreground">Review finalized laboratory reports and retrieve documents.</p>
        </div>
        <button
          type="button"
          onClick={fetchReports}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by patient or test name"
          className="w-full rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {filteredReports.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
          No completed reports found.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => {
          const summaryPayload = parseReportPayload(report.reportData)
          return (
            <button
              type="button"
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className={`group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 text-left transition hover:-translate-y-0.5 hover:shadow ${
                selectedReportId === report.id ? "ring-2 ring-primary/60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <FileText size={18} />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{report.patientName}</h3>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Test #{report.id}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <UserRound size={14} className="text-muted-foreground/80" />
                      <span>{report.testName}</span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground/70">Requested {safeDate(report.date)}</p>
                  </div>

                  {report.patientEmail && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={14} className="text-muted-foreground/80" />
                      <span>{report.patientEmail}</span>
                    </div>
                  )}
                  {report.patientPhone && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={14} className="text-muted-foreground/80" />
                      <span>{report.patientPhone}</span>
                    </div>
                  )}
                </div>

                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone(report.status)}`}>
                  {formatStatus(report.status)}
                </span>
              </div>

              <div className="mt-6 grid gap-2 text-sm text-muted-foreground/90">
                <p className="flex items-center gap-2">
                  <CalendarClock size={14} className="text-muted-foreground/80" />
                  <span>
                    Completed: <span className="text-foreground font-semibold">{safeDate(report.reportDate)}</span>
                  </span>
                </p>
              </div>

              {summaryPayload && (
                <div className="mt-6 rounded-xl bg-muted/20 p-4 text-sm text-muted-foreground/90">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Summary</p>
                  <p className="mt-1 line-clamp-2 text-foreground/90">
                    {summaryPayload.findings || summaryPayload.raw || "Report ready"}
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedReportId && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelectedReportId(null)}>
          <div
            className="w-full max-w-3xl rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <FileText size={22} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{selectedReport.testName}</h2>
                    <p className="text-sm text-muted-foreground">Report #{selectedReport.id}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground/90">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 uppercase tracking-wide">
                    <UserRound size={14} /> {selectedReport.patientName}
                  </span>
                  {selectedReport.patientEmail && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm font-medium text-muted-foreground">
                      <Mail size={14} /> {selectedReport.patientEmail}
                    </span>
                  )}
                  {selectedReport.patientPhone && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm font-medium text-muted-foreground">
                      <Phone size={14} /> {selectedReport.patientPhone}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted/40"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Status</p>
                <span className={`mt-2 inline-flex w-fit items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone(selectedReport.status)}`}>
                  {formatStatus(selectedReport.status)}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Requested</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{safeDate(selectedReport.date)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Completed</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{safeDate(selectedReport.reportDate)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/15 p-5 text-sm text-muted-foreground/90">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarClock size={18} /> Activity
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground/70">Requested</p>
                  <p className="text-foreground font-medium">{safeDate(selectedReport.date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground/70">Completed</p>
                  <p className="text-foreground font-medium">{safeDate(selectedReport.reportDate)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/15 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText size={18} /> Report Notes
              </div>
              <div className="space-y-3 text-sm text-foreground/80">
                {!detailPayload && <p className="text-muted-foreground">No additional report details provided.</p>}

                {detailPayload?.findings && (
                  <div>
                    <p className="text-muted-foreground/70 text-xs uppercase">Findings</p>
                    <p className="mt-1 whitespace-pre-wrap text-foreground/90">{detailPayload.findings}</p>
                  </div>
                )}

                {detailPayload?.referenceRange && (
                  <div>
                    <p className="text-muted-foreground/70 text-xs uppercase">Reference Range</p>
                    <p className="mt-1 text-foreground/80">{detailPayload.referenceRange}</p>
                  </div>
                )}

                {detailPayload?.interpretation && (
                  <div>
                    <p className="text-muted-foreground/70 text-xs uppercase">Interpretation</p>
                    <p className="mt-1 whitespace-pre-wrap text-foreground/80">{detailPayload.interpretation}</p>
                  </div>
                )}

                {detailPayload?.attachmentName && (
                  <div>
                    <p className="text-muted-foreground/70 text-xs uppercase">Attachment</p>
                    <p className="mt-1 text-foreground/80">{detailPayload.attachmentName}</p>
                  </div>
                )}

                {!detailPayload?.findings &&
                  !detailPayload?.referenceRange &&
                  !detailPayload?.interpretation &&
                  detailPayload?.raw && <p className="whitespace-pre-wrap">{detailPayload.raw}</p>}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => handleDownload(selectedReport.id)}
                disabled={!selectedReport.reportFilePath}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  selectedReport.reportFilePath
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "cursor-not-allowed bg-muted text-muted-foreground"
                }`}
              >
                <Download size={18} /> Download Report
              </button>

              {selectedReport.reportFilePath ? (
                <p className="text-center text-xs text-muted-foreground/80">File reference: {selectedReport.reportFilePath}</p>
              ) : (
                <p className="text-center text-xs text-muted-foreground/70">No file reference attached.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompletedReportsPage