"use client"

import { useState, useEffect } from "react"
import { patientAPI } from "../../services/api"
import { FileText, Download, Eye } from "lucide-react"
import { toast } from "react-hot-toast"
import { PageContainer } from "../../components/PageContainer"
import { DashboardCard } from "../../components/DashboardCard"

export const LabReportsPage = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await patientAPI.getLabReports()
      setReports(response.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load lab reports")
      console.log("[v0] Error fetching lab reports:", error)
      setReports([])
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
      title="Lab reports"
      description="Review completed and in-progress diagnostics."
      contentClassName="bg-card/90"
    >
      {reports.length === 0 ? (
        <DashboardCard className="border-dashed border border-border/60 text-center">
          <p className="text-sm text-muted-foreground">No lab reports are available yet.</p>
        </DashboardCard>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-border/60 bg-card/85 p-6 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <FileText size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">{report.testName}</h3>
                    <p className="text-sm text-muted-foreground">{report.labName}</p>
                    <p className="text-xs text-muted-foreground/80">Date: {report.date}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    report.status === "Completed"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : report.status === "Pending"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-rose-500/15 text-rose-600"
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-background/80 p-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Result:</span> {report.results}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-full border border-border/50 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-primary">
                  <Eye size={18} /> View details
                </button>
                <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                  <Download size={18} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
export default LabReportsPage