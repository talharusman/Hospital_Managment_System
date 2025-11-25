"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Calendar, Download, FileText, Microscope, X } from "lucide-react"
import { patientAPI } from "../../services/api"
import { PageContainer } from "../../components/PageContainer"
import { DashboardCard } from "../../components/DashboardCard"

export const LabReportsPage = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await patientAPI.getLabReports()
      setReports(response.data)
    } catch (error) {
      console.error("[patient] Failed to load lab reports", error)
      toast.error(error.response?.data?.message || "Failed to load lab reports")
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const closeDetails = () => setSelectedReport(null)

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
    if (!selectedReport) {
      toast.error("Select a lab report to download")
      return
    }

    if (selectedReport.reportFile) {
      const link = document.createElement("a")
      link.href = selectedReport.reportFile
      link.download = selectedReport.reportFile.split("/").pop() || `lab-report-${selectedReport.id}.pdf`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Lab report download started")
      return
    }

    const lines = [
      `Lab Report ${selectedReport.id}`,
      `Test: ${selectedReport.testName}`,
      `Status: ${selectedReport.status}`,
      `Date: ${selectedReport.date}`,
      `Laboratory: ${selectedReport.labName}`,
      "",
      "Results:",
      selectedReport.results || "No detailed results provided.",
    ]

    triggerDownload(`lab-report-${selectedReport.id}.txt`, lines.join("\n"))
    toast.success("Lab report download started")
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500/15 text-emerald-500"
      case "Pending":
        return "bg-amber-500/15 text-amber-600"
      default:
        return "bg-rose-500/15 text-rose-600"
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
    <>
      <PageContainer
        title="Lab reports"
        description="Review diagnostics and download detailed laboratory findings."
        contentClassName="bg-transparent p-0 border-none shadow-none"
      >
        <div className="space-y-6">
          {reports.length === 0 ? (
            <DashboardCard className="rounded-3xl border border-dashed border-border/60 text-center text-sm text-muted-foreground">
              No lab reports are available yet.
            </DashboardCard>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => (
                <div key={report.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedReport(report)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedReport(report)
                      }
                    }}
                    className="flex h-full cursor-pointer flex-col rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{report.testName}</h3>
                        <p className="text-sm text-muted-foreground">{report.labName}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(report.status)}`}>
                        {report.status}
                      </span>
                    </div>

                    <p className="mt-6 text-sm font-medium text-muted-foreground/80">Select to view lab report details.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeDetails}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedReport.testName}</h2>
                <p className="text-sm text-muted-foreground">{selectedReport.labName}</p>
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

            <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedReport.status)}`}>
              {selectedReport.status}
            </span>

            <div className="mt-6 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2 text-foreground">
                <Microscope size={16} />
                <span>{selectedReport.testName}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Calendar size={16} />
                <span>{selectedReport.date}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <FileText size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Results</p>
                </div>
                <p className="mt-2 whitespace-pre-line text-foreground">{selectedReport.results || "Results pending."}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
              >
                <Download size={16} /> Download report
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
export default LabReportsPage