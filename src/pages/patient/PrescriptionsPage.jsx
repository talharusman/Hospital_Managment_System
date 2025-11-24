"use client"

import { useState, useEffect } from "react"
import { patientAPI } from "../../services/api"
import { Download } from "lucide-react"
import { toast } from "react-hot-toast"
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
      toast.error(error.response?.data?.message || "Failed to load prescriptions")
      console.log("[v0] Error fetching prescriptions:", error)
      setPrescriptions([])
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
      title="My prescriptions"
      description="Access medication plans and download detailed instructions."
      contentClassName="bg-card/90"
      className="grid-cols-1 lg:grid-cols-[2fr_1fr]"
    >
      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <DashboardCard className="border border-dashed border-border/60 text-center">
            <p className="text-sm text-muted-foreground">No prescriptions issued yet.</p>
          </DashboardCard>
        ) : (
          prescriptions.map((prescription) => {
            const isSelected = selectedPrescription?.id === prescription.id
            return (
              <button
                key={prescription.id}
                onClick={() => setSelectedPrescription(prescription)}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  isSelected
                    ? "border-primary/70 bg-primary/10 shadow-md"
                    : "border-border/60 bg-card/80 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">{prescription.doctorName}</h3>
                    <p className="text-sm text-muted-foreground">{prescription.date}</p>
                    <p className="text-xs text-muted-foreground/80">{prescription.clinicName}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-border/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {prescription.medications.length} meds
                  </span>
                </div>
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {prescription.medications.slice(0, 3).map((medication, index) => (
                    <p key={index}>
                      <span className="font-medium text-foreground">{medication.name}</span> · {medication.dosage} · {medication.frequency}
                    </p>
                  ))}
                  {prescription.medications.length > 3 && (
                    <p className="text-xs text-muted-foreground/80">+{prescription.medications.length - 3} more medications</p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      <aside className="space-y-4 rounded-2xl border border-border/60 bg-card/85 p-5">
        {selectedPrescription ? (
          <>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Prescription details</h2>
              <p className="text-sm text-muted-foreground">
                Issued by <span className="font-medium text-foreground">{selectedPrescription.doctorName}</span>
              </p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Date</p>
                <p className="text-sm text-foreground">{selectedPrescription.date}</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Medications</p>
                <div className="space-y-3">
                  {selectedPrescription.medications.map((medication, index) => (
                    <div key={index} className="rounded-xl border border-border/40 bg-background/80 p-3">
                      <p className="font-semibold text-foreground">{medication.name}</p>
                      <p className="text-xs text-muted-foreground/80">Dosage: {medication.dosage}</p>
                      <p className="text-xs text-muted-foreground/80">Frequency: {medication.frequency}</p>
                      {medication.duration && (
                        <p className="text-xs text-muted-foreground/80">Duration: {medication.duration}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {selectedPrescription.notes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Notes</p>
                  <p className="text-sm text-foreground">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
              <Download size={18} /> Download PDF
            </button>
          </>
        ) : (
          <div className="space-y-2 text-sm text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Select a prescription</h2>
            <p>Choose from the list to review medications and download a copy.</p>
          </div>
        )}
      </aside>
    </PageContainer>
  )
}
export default PrescriptionsPage