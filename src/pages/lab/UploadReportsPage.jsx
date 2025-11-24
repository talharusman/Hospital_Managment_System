"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Upload, RefreshCw, ClipboardList } from "lucide-react"

import { labAPI } from "../../services/api"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

const normalizeStatus = (value) => value?.toString().toLowerCase().replace(/\s+/g, "-")

export const UploadReportsPage = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileName, setFileName] = useState("")
  const [formData, setFormData] = useState({
    testId: "",
    findings: "",
    referenceRange: "",
    interpretation: "",
  })

  useEffect(() => {
    fetchEligibleTests()
  }, [])

  const fetchEligibleTests = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await labAPI.getTests()
      const data = Array.isArray(response.data) ? response.data : []
      const eligible = data.filter((test) => {
        const status = normalizeStatus(test.rawStatus || test.status)
        return status === "pending" || status === "in-progress"
      })
      setTests(eligible)
      setFormData((prev) => ({ ...prev, testId: prev.testId || (eligible[0]?.id?.toString() ?? "") }))
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load lab tests"
      setError(message)
      toast.error(message)
      setTests([])
    } finally {
      setLoading(false)
    }
  }

  const selectedTest = useMemo(
    () => tests.find((test) => test.id?.toString() === formData.testId?.toString()) || null,
    [tests, formData.testId],
  )

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    setFileName(file ? file.name : "")
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.testId) {
      toast.error("Select a test to continue")
      return
    }

    if (!formData.findings.trim()) {
      toast.error("Findings are required")
      return
    }

    setIsSubmitting(true)
    try {
      const testId = Number(formData.testId)
      const payload = {
        reportData: JSON.stringify({
          findings: formData.findings,
          referenceRange: formData.referenceRange,
          interpretation: formData.interpretation,
          attachmentName: fileName || null,
        }),
        reportFilePath: fileName || null,
      }

      await labAPI.uploadReport(testId, payload)
      toast.success("Report uploaded successfully")

      setFormData({ testId: "", findings: "", referenceRange: "", interpretation: "" })
      setFileName("")
      fetchEligibleTests()
    } catch (err) {
      const message = err.response?.data?.message || "Failed to upload report"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchEligibleTests} />

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Lab Reports</h1>
          <p className="text-muted-foreground">Attach findings and finalize pending or in-progress tests.</p>
        </div>
        <button
          type="button"
          onClick={fetchEligibleTests}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
        >
          <RefreshCw size={16} /> Refresh Tests
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
            {tests.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                No pending tests require reports right now.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Select Test</label>
                  <select
                    value={formData.testId}
                    onChange={(event) => handleChange("testId", event.target.value)}
                    required
                    className="w-full rounded-lg border border-border/60 bg-card/70 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Choose a test</option>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.testName} — {test.patientName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Findings</label>
                  <textarea
                    value={formData.findings}
                    onChange={(event) => handleChange("findings", event.target.value)}
                    placeholder="Summarize the lab findings"
                    required
                    className="h-28 w-full rounded-lg border border-border/60 bg-card/70 px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Reference Range</label>
                  <input
                    type="text"
                    value={formData.referenceRange}
                    onChange={(event) => handleChange("referenceRange", event.target.value)}
                    placeholder="e.g. 4.5 - 11.0 x10^9/L"
                    className="w-full rounded-lg border border-border/60 bg-card/70 px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Interpretation</label>
                  <textarea
                    value={formData.interpretation}
                    onChange={(event) => handleChange("interpretation", event.target.value)}
                    placeholder="Add clinical interpretation or follow-up recommendations"
                    className="h-24 w-full rounded-lg border border-border/60 bg-card/70 px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Report File (optional)</label>
                  <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center transition hover:border-primary/50">
                    <input type="file" onChange={handleFileChange} className="hidden" id="report-upload" accept=".pdf,.doc,.docx,.jpg,.png" />
                    <label htmlFor="report-upload" className="flex cursor-pointer flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Upload size={24} />
                      <span className="font-medium text-foreground">Click to choose a file</span>
                      <span className="text-xs text-muted-foreground/80">Optional reference to an uploaded document</span>
                      {fileName && <span className="text-xs text-(--pill-info-fg)">Selected: {fileName}</span>}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.testId || !formData.findings.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  <Upload size={18} /> {isSubmitting ? "Uploading..." : "Upload Report"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <ClipboardList size={18} /> Upload Guidelines
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>Summaries should cover key findings and any critical alerts.</li>
              <li>Include reference ranges when values deviate from normal.</li>
              <li>Attach a file reference only if a detailed document exists elsewhere.</li>
              <li>Reports are automatically marked as completed after submission.</li>
              <li>Use the refresh button to pull the latest pending requests.</li>
            </ul>
          </div>

          {selectedTest ? (
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Selected Test</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground/70">Patient</p>
                  <p className="text-foreground font-semibold">{selectedTest.patientName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground/70">Test</p>
                  <p className="text-foreground font-medium">{selectedTest.testName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground/70">Requested</p>
                  <p className="text-foreground font-medium">{selectedTest.date || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground/70">Status</p>
                  <p className="text-foreground font-medium">{selectedTest.status}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
              Choose a test to view its patient details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadReportsPage