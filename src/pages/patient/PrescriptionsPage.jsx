"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Calendar, FileText, Pill, X, Download } from "lucide-react"
import { patientAPI } from "../../services/api"
import { PageContainer } from "../../components/PageContainer"
import { DashboardCard } from "../../components/DashboardCard"

export const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      const response = await patientAPI.getPrescriptions()
      setPrescriptions(response.data)
    } catch (error) {
      console.error("[patient] Failed to load prescriptions", error)
      toast.error(error.response?.data?.message || "Failed to load prescriptions")
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }

  const closeDetails = () => setSelectedPrescription(null)

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
    if (!selectedPrescription) {
      toast.error("Select a prescription to download")
      return
    }

    const medications = selectedPrescription.medications && selectedPrescription.medications.length > 0
      ? selectedPrescription.medications
      : []

    const lines = [
      `Prescription ${selectedPrescription.id}`,
      `Doctor: ${selectedPrescription.doctorName}`,
      `Date: ${selectedPrescription.date}`,
      "",
      "Medications:",
      ...(medications.length > 0
        ? medications.map((medication, index) => {
            const parts = [medication.name || `Medication ${index + 1}`]
            if (medication.dosage) parts.push(`Dosage: ${medication.dosage}`)
            if (medication.frequency) parts.push(`Frequency: ${medication.frequency}`)
            if (medication.duration) parts.push(`Duration: ${medication.duration}`)
            return `- ${parts.join(" | ")}`
          })
        : ["- No medications specified"]),
      "",
      selectedPrescription.notes ? `Notes: ${selectedPrescription.notes}` : "",
    ].filter(Boolean)

    triggerDownload(`prescription-${selectedPrescription.id}.txt`, lines.join("\n"))
    toast.success("Prescription download started")
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
        title="My prescriptions"
        description="Browse prescriptions from your doctors and download the full details."
        contentClassName="bg-transparent p-0 border-none shadow-none"
      >
        <div className="space-y-6">
          {prescriptions.length === 0 ? (
            <DashboardCard className="rounded-3xl border border-dashed border-border/60 text-center text-sm text-muted-foreground">
              No prescriptions issued yet.
            </DashboardCard>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {prescriptions.map((prescription) => (
                <div key={prescription.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPrescription(prescription)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedPrescription(prescription)
                      }
                    }}
                    className="flex h-full cursor-pointer flex-col rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{prescription.doctorName}</h3>
                        <p className="text-sm text-muted-foreground">Prescription</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-semibold text-primary">
                        {prescription.date}
                      </span>
                    </div>

                    <p className="mt-6 text-sm font-medium text-muted-foreground/80">Select to view prescription details.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>

      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeDetails}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedPrescription.doctorName}</h2>
                <p className="text-sm text-muted-foreground">Issued prescription</p>
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
                <Calendar size={16} />
                <span>{selectedPrescription.date}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Pill size={16} />
                <span>{selectedPrescription.medications?.length || 0} medications</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Medications</p>
                <div className="mt-3 space-y-3">
                  {(selectedPrescription.medications && selectedPrescription.medications.length > 0
                    ? selectedPrescription.medications
                    : [
                        {
                          name: "No medications listed",
                          dosage: "",
                          frequency: "",
                        },
                      ]).map((medication, index) => (
                    <div
                      key={`${medication.name || "medication"}-${index}`}
                      className="rounded-2xl border border-border/50 bg-muted/40 p-4 text-sm text-muted-foreground"
                    >
                      <div className="flex items-center gap-2 text-foreground">
                        <Pill size={16} />
                        <p className="font-semibold">{medication.name || "Medication"}</p>
                      </div>
                      {medication.dosage && <p className="mt-2 text-xs text-muted-foreground/80">Dosage: {medication.dosage}</p>}
                      {medication.frequency && (
                        <p className="text-xs text-muted-foreground/80">Frequency: {medication.frequency}</p>
                      )}
                      {medication.duration && (
                        <p className="text-xs text-muted-foreground/80">Duration: {medication.duration}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescription.notes && (
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground">
                    <FileText size={16} />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Notes</p>
                  </div>
                  <p className="mt-2 text-foreground">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
              >
                <Download size={16} /> Download PDF
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
export default PrescriptionsPage
