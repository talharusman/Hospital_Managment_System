"use client"

import { useState, useEffect } from "react"
import { doctorAPI } from "../../services/api"
import toast from "react-hot-toast"
import { CalendarClock, ClipboardList, Pill, Plus, Save, Trash2, X } from "lucide-react"

export const PrescriptionsPage = () => {
  const [showForm, setShowForm] = useState(false)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [formData, setFormData] = useState({
    patientId: "",
    medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
    notes: "",
  })

  const resetForm = () => {
    setFormData({
      patientId: "",
      medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
      notes: "",
    })
  }

  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: "", dosage: "", frequency: "", duration: "" }],
    })
  }

  const handleRemoveMedication = (index) => {
    if (formData.medications.length === 1) return
    const next = formData.medications.filter((_, idx) => idx !== index)
    setFormData({ ...formData, medications: next })
  }

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications]
    newMedications[index][field] = value
    setFormData({ ...formData, medications: newMedications })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedPatient = formData.patientId.trim()
    const cleanedMedications = formData.medications
      .map((med) => ({
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        frequency: med.frequency.trim(),
        duration: med.duration.trim(),
      }))
      .filter((med) => med.name)

    if (!trimmedPatient) {
      toast.error("Select a patient before saving")
      return
    }

    if (cleanedMedications.length === 0) {
      toast.error("Add at least one medication")
      return
    }

    setSubmitting(true)
    try {
      await doctorAPI.createPrescription({
        patientId: trimmedPatient,
        medications: cleanedMedications,
        notes: formData.notes.trim(),
      })
      toast.success("Prescription created successfully")
      setShowForm(false)
      resetForm()
      fetchPrescriptions()
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create prescription")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    setLoading(true)
    try {
      const response = await doctorAPI.getPrescriptions()
      setPrescriptions(response.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load prescriptions")
      console.log("[v0] Error fetching doctor prescriptions:", error)
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }

  const closeDetails = () => setSelectedPrescription(null)

  const prescriptionStatusBadge = (status) => {
    const value = status?.toLowerCase()
    if (value === "completed") return "bg-(--status-completed-bg) text-(--status-completed-fg)"
    if (value === "cancelled") return "bg-(--status-cancelled-bg) text-(--status-cancelled-fg)"
    if (value === "expired") return "bg-(--status-pending-bg) text-(--status-pending-fg)"
    return "bg-(--pill-info-bg) text-(--pill-info-fg)"
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border/70 border-t-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-foreground">Prescriptions</h1>
        <button
          onClick={() => {
            setShowForm(true)
            setSelectedPrescription(null)
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus size={20} /> New Prescription
        </button>
      </div>
      {showForm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            if (!submitting) {
              setShowForm(false)
              resetForm()
            }
          }}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Create Prescription</h2>
                <p className="text-sm text-muted-foreground">Document medications, dosage, and special instructions.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!submitting) {
                    setShowForm(false)
                    resetForm()
                  }
                }}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted/40"
                aria-label="Close form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Patient</label>
                <input
                  type="text"
                  placeholder="Patient ID or Name"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Medications</label>
                <div className="space-y-4">
                  {formData.medications.map((med, idx) => (
                    <div key={idx} className="rounded-xl border border-border/60 bg-background/60 p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <input
                          type="text"
                          placeholder="Medication Name"
                          value={med.name}
                          onChange={(e) => handleMedicationChange(idx, "name", e.target.value)}
                          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Dosage (e.g., 500mg)"
                          value={med.dosage}
                          onChange={(e) => handleMedicationChange(idx, "dosage", e.target.value)}
                          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                        />
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={med.frequency}
                          onChange={(e) => handleMedicationChange(idx, "frequency", e.target.value)}
                          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g., 7 days)"
                          value={med.duration}
                          onChange={(e) => handleMedicationChange(idx, "duration", e.target.value)}
                          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      {formData.medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-(--action-danger) transition hover:text-(--action-danger-hover)"
                        >
                          <Trash2 size={16} /> Remove medication
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="mt-2 text-sm font-semibold text-(--pill-info-fg) transition hover:text-primary"
                >
                  + Add another medication
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Notes</label>
                <textarea
                  placeholder="Additional notes or instructions"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-32 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) {
                      setShowForm(false)
                      resetForm()
                    }
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-(--action-disabled-bg) disabled:text-(--action-disabled-foreground)"
                >
                  <Save size={20} /> {submitting ? "Saving..." : "Create Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescriptions List */}
      {loading ? (
        <div className="mt-10 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border/70 border-t-primary" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
          No prescriptions recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {prescriptions.map((prescription) => (
            <button
              key={prescription.id}
              type="button"
              onClick={() => setSelectedPrescription(prescription)}
              className="flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{prescription.patientName}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prescription #{prescription.id}</p>
                </div>
                {prescription.status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${prescriptionStatusBadge(prescription.status)}`}
                  >
                    {prescription.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock size={16} />
                <span>{prescription.date}</span>
              </div>
              <p className="text-xs text-muted-foreground/90">
                {prescription.medications?.length || 0} medication{(prescription.medications?.length || 0) === 1 ? "" : "s"}
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedPrescription && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
          onClick={closeDetails}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedPrescription.patientName}</h2>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Prescription #{selectedPrescription.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedPrescription.status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${prescriptionStatusBadge(selectedPrescription.status)}`}
                  >
                    {selectedPrescription.status}
                  </span>
                )}
                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-muted/40"
                  aria-label="Close prescription details"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
              <div className="rounded-xl border border-border/50 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Issued</p>
                <p className="mt-2 flex items-center gap-2 text-foreground">
                  <CalendarClock size={16} /> {selectedPrescription.date || "Date not available"}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Medications</p>
                <p className="mt-2 text-foreground">
                  {selectedPrescription.medications?.length || 0} item{(selectedPrescription.medications?.length || 0) === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-foreground">Medication details</p>
              {selectedPrescription.medications?.length ? (
                <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                  {selectedPrescription.medications.map((med, idx) => (
                    <li key={`${selectedPrescription.id}-${idx}`} className="rounded-xl border border-border/50 bg-background/60 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-foreground">{med.name}</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-(--pill-info-bg) px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-(--pill-info-fg)">
                          <Pill size={12} /> Medication
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {med.dosage && <span>Dosage: {med.dosage}</span>}
                        {med.frequency && <span>Frequency: {med.frequency}</span>}
                        {med.duration && <span>Duration: {med.duration}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No medications were recorded for this prescription.</p>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-foreground">Notes</p>
              {selectedPrescription.notes ? (
                <div className="mt-2 flex gap-2 rounded-xl border border-border/50 bg-background/60 p-4 text-sm text-foreground">
                  <ClipboardList size={16} className="mt-1 text-muted-foreground" />
                  <p>{selectedPrescription.notes}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No additional notes provided.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default PrescriptionsPage