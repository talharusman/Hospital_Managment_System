"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { CalendarX, Clock, Phone, MapPin, CheckCircle, XCircle, X, TestTubes, ClipboardList } from "lucide-react"

import { doctorAPI } from "../../services/api"

export const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [pendingCompletion, setPendingCompletion] = useState(null)
  const [completionTab, setCompletionTab] = useState("summary")
  const [labRequestData, setLabRequestData] = useState({ testType: "", priority: "routine", notes: "" })
  const [prescriptionForm, setPrescriptionForm] = useState({
    medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
    notes: "",
  })
  const [submittingCompletion, setSubmittingCompletion] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [filter])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const response = await doctorAPI.getAppointments({ status: filter === "all" ? null : filter })
      setAppointments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load appointments")
      console.log("[v0] Error fetching doctor appointments:", error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await doctorAPI.updateAppointmentStatus(appointmentId, newStatus)
      toast.success("Appointment updated")
      fetchAppointments()
      setSelectedAppointment(null)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update appointment")
    }
  }

  const openCompletionModal = (appointment) => {
    if (!appointment) return
    setPendingCompletion(appointment)
    setLabRequestData({ testType: "", priority: "routine", notes: "" })
    setPrescriptionForm({ medications: [{ name: "", dosage: "", frequency: "", duration: "" }], notes: "" })
    setCompletionTab("summary")
    setShowCompletionModal(true)
    setSelectedAppointment(null)
  }

  const closeCompletionModal = () => {
    if (submittingCompletion) return
    setShowCompletionModal(false)
    setPendingCompletion(null)
  }

  const handleLabRequestFieldChange = (field, value) => {
    setLabRequestData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMedicationFieldChange = (index, field, value) => {
    setPrescriptionForm((prev) => {
      const next = [...prev.medications]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, medications: next }
    })
  }

  const addMedicationRow = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: "", dosage: "", frequency: "", duration: "" }],
    }))
  }

  const removeMedicationRow = (index) => {
    setPrescriptionForm((prev) => {
      if (prev.medications.length === 1) return prev
      const next = prev.medications.filter((_, idx) => idx !== index)
      return { ...prev, medications: next }
    })
  }

  const completeAppointment = async ({ withLabRequest = false, withPrescription = false }) => {
    if (!pendingCompletion) return

    const trimmedTestType = labRequestData.testType.trim()
    const trimmedNotes = labRequestData.notes.trim()
    const priorityValue = labRequestData.priority || ""
    const sanitizedMedications = prescriptionForm.medications
      .map((med) => ({
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        frequency: med.frequency.trim(),
        duration: med.duration.trim(),
      }))
      .filter((med) => med.name)
    const prescriptionNotes = prescriptionForm.notes.trim()

    if (withLabRequest && !trimmedTestType) {
      toast.error("Test type is required to submit a lab request")
      setCompletionTab("lab")
      return
    }

    if (withPrescription && sanitizedMedications.length === 0) {
      toast.error("Add at least one medication before sending a prescription")
      setCompletionTab("prescription")
      return
    }

    if (withPrescription && !pendingCompletion.patientId) {
      toast.error("Patient information is missing for this appointment")
      return
    }

    const payload = withLabRequest && trimmedTestType
      ? {
          testType: trimmedTestType,
          notes: trimmedNotes,
          priority: priorityValue,
        }
      : null

    setSubmittingCompletion(true)
    try {
      if (withPrescription) {
        await doctorAPI.createPrescription({
          patientId: pendingCompletion.patientId,
          medications: sanitizedMedications,
          notes: prescriptionNotes,
        })
      }

      await doctorAPI.updateAppointmentStatus(pendingCompletion.id, "Completed", payload)
      const successMessages = ["Appointment completed"]
      if (payload) successMessages.push("lab request sent")
      if (withPrescription) successMessages.push("prescription submitted")
      toast.success(successMessages.join(" • "))
      setShowCompletionModal(false)
      setPendingCompletion(null)
      fetchAppointments()
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete appointment")
    } finally {
      setSubmittingCompletion(false)
    }
  }

  const closeDetails = () => setSelectedAppointment(null)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border/70 border-t-primary" />
      </div>
    )
  }

  const filteredAppointments =
    filter === "all"
      ? appointments
      : appointments.filter((appt) => appt.status?.toLowerCase() === filter.toLowerCase())

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-8 text-3xl font-semibold text-foreground">Appointments</h1>

      <div className="mb-6 flex gap-2">
        {["all", "scheduled", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg border px-4 py-2 capitalize transition ${
              filter === status
                ? "border-primary/60 bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 p-10 text-center">
            <CalendarX className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">No appointments found</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              There are no appointments in this view right now. Try another filter or check back later.
            </p>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <button
              key={appt.id}
              type="button"
              onClick={() => setSelectedAppointment(appt)}
              className="flex flex-col items-start gap-4 rounded-xl border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="flex w-full items-center justify-between">
                <p className="text-lg font-semibold text-foreground">{appt.patientName}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    appt.status === "Scheduled"
                      ? "bg-(--pill-info-bg) text-(--pill-info-fg)"
                      : appt.status === "Completed"
                        ? "bg-(--status-completed-bg) text-(--status-completed-fg)"
                        : "bg-(--status-cancelled-bg) text-(--status-cancelled-fg)"
                  }`}
                >
                  {appt.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={16} />
                <span>
                  {appt.date} • {appt.time}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
          onClick={closeDetails}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedAppointment.patientName}</h2>
                <p className="text-sm text-muted-foreground">Appointment details</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted/40"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/50 p-3">
                <p className="text-xs font-semibold uppercase">Date &amp; time</p>
                <p className="mt-1 text-base text-foreground">
                  {selectedAppointment.date} • {selectedAppointment.time}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 p-3">
                <p className="text-xs font-semibold uppercase">Contact</p>
                <p className="mt-1 flex items-center gap-2 text-foreground">
                  <Phone size={16} /> {selectedAppointment.patientPhone}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 p-3">
                <p className="text-xs font-semibold uppercase">Reason</p>
                <p className="mt-1 text-foreground">{selectedAppointment.reason}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3">
                <p className="text-xs font-semibold uppercase">Location / Notes</p>
                <p className="mt-1 flex items-center gap-2 text-foreground">
                  <MapPin size={16} />
                  <span>{selectedAppointment.location || "Clinic"}</span>
                </p>
                {selectedAppointment.notes && <p className="mt-2 text-sm">{selectedAppointment.notes}</p>}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                <div>
                  <p className="text-xs font-semibold uppercase">Status</p>
                  <p className="mt-1 text-foreground">{selectedAppointment.status}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    selectedAppointment.status === "Scheduled"
                      ? "bg-(--pill-info-bg) text-(--pill-info-fg)"
                      : selectedAppointment.status === "Completed"
                        ? "bg-(--status-completed-bg) text-(--status-completed-fg)"
                        : "bg-(--status-cancelled-bg) text-(--status-cancelled-fg)"
                  }`}
                >
                  {selectedAppointment.status}
                </span>
              </div>
            </div>

            {(() => {
              const normalizedStatus = selectedAppointment.status?.toLowerCase() || ""
              const canMarkComplete = normalizedStatus !== "completed" && normalizedStatus !== "cancelled"
              const canCancelAppointment = normalizedStatus !== "completed" && normalizedStatus !== "cancelled"

              return (
                <div className="mt-6 space-y-2">
                  {canMarkComplete && (
                    <button
                      onClick={() => openCompletionModal(selectedAppointment)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--action-success) px-4 py-2 text-(--action-success-foreground) transition hover:bg-(--action-success-hover)"
                    >
                      <CheckCircle size={18} /> Mark Complete
                    </button>
                  )}
                  {canCancelAppointment && (
                    <button
                      onClick={() => handleStatusUpdate(selectedAppointment.id, "Cancelled")}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--action-danger) px-4 py-2 text-(--action-danger-foreground) transition hover:bg-(--action-danger-hover)"
                    >
                      <XCircle size={18} /> Cancel Appointment
                    </button>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {showCompletionModal && pendingCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={closeCompletionModal}>
          <div
            className="w-full max-w-2xl rounded-3xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Complete appointment</h2>
                <p className="text-sm text-muted-foreground">
                  Wrap up the visit and optionally send a lab request to the diagnostics team.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCompletionModal}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted/40"
                aria-label="Close completion dialog"
                disabled={submittingCompletion}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              {[
                { id: "summary", label: "Visit summary" },
                { id: "lab", label: "Lab test request" },
                { id: "prescription", label: "Prescription" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCompletionTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    completionTab === tab.id
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                  disabled={submittingCompletion}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {completionTab === "summary" ? (
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide">Patient</p>
                  <p className="mt-1 text-base text-foreground">{pendingCompletion.patientName}</p>
                  <p className="mt-1 flex items-center gap-2">
                    <Phone size={16} /> {pendingCompletion.patientPhone || "No phone"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide">Visit details</p>
                  <p className="mt-1 text-base text-foreground">
                    {pendingCompletion.date} • {pendingCompletion.time}
                  </p>
                  <p className="mt-2 text-sm">Reason: {pendingCompletion.reason || "Not specified"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide">Completion actions</p>
                  <p className="mt-1 text-sm">
                    Submit now to record this appointment as completed. You can add a lab request from the next tab if
                    needed.
                  </p>
                </div>
              </div>
            ) : completionTab === "lab" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <TestTubes size={18} /> Optional lab test request
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Provide details for the lab so they can process the diagnostics promptly.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="lab-test-type">
                    Test type
                  </label>
                  <input
                    id="lab-test-type"
                    type="text"
                    value={labRequestData.testType}
                    onChange={(event) => handleLabRequestFieldChange("testType", event.target.value)}
                    placeholder="e.g. Complete blood count"
                    className="w-full rounded-xl border border-border px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={submittingCompletion}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="lab-priority">
                    Priority
                  </label>
                  <select
                    id="lab-priority"
                    value={labRequestData.priority}
                    onChange={(event) => handleLabRequestFieldChange("priority", event.target.value)}
                    className="w-full rounded-xl border border-border px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={submittingCompletion}
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="lab-notes">
                    Notes for lab (optional)
                  </label>
                  <textarea
                    id="lab-notes"
                    rows={4}
                    value={labRequestData.notes}
                    onChange={(event) => handleLabRequestFieldChange("notes", event.target.value)}
                    placeholder="Clinical notes, differential diagnosis, or handling instructions"
                    className="w-full rounded-xl border border-border px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={submittingCompletion}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-(--pill-info-bg)/30 bg-(--pill-info-bg)/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-(--pill-info-fg)">
                    <ClipboardList size={18} /> Optional prescription
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Capture medications and instructions before finalizing this visit.
                  </p>
                </div>

                <div className="space-y-4">
                  {prescriptionForm.medications.map((medication, index) => (
                    <div key={`prescription-med-${index}`} className="rounded-2xl border border-border/60 bg-card/50 p-4 shadow-sm">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide">Medication name</label>
                          <input
                            type="text"
                            value={medication.name}
                            onChange={(event) => handleMedicationFieldChange(index, "name", event.target.value)}
                            placeholder="e.g. Amoxicillin"
                            className="w-full rounded-xl border border-border px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            disabled={submittingCompletion}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide">Dosage</label>
                          <input
                            type="text"
                            value={medication.dosage}
                            onChange={(event) => handleMedicationFieldChange(index, "dosage", event.target.value)}
                            placeholder="500mg"
                            className="w-full rounded-xl border border-border px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            disabled={submittingCompletion}
                          />
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide">Frequency</label>
                          <input
                            type="text"
                            value={medication.frequency}
                            onChange={(event) => handleMedicationFieldChange(index, "frequency", event.target.value)}
                            placeholder="Twice daily"
                            className="w-full rounded-xl border border-border px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            disabled={submittingCompletion}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide">Duration</label>
                          <input
                            type="text"
                            value={medication.duration}
                            onChange={(event) => handleMedicationFieldChange(index, "duration", event.target.value)}
                            placeholder="7 days"
                            className="w-full rounded-xl border border-border px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            disabled={submittingCompletion}
                          />
                        </div>
                      </div>
                      {prescriptionForm.medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicationRow(index)}
                          className="mt-4 text-xs font-semibold uppercase tracking-wide text-(--action-danger) transition hover:text-(--action-danger-hover)"
                          disabled={submittingCompletion}
                        >
                          Remove medication
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="text-sm font-semibold text-primary transition hover:text-primary/80"
                  onClick={addMedicationRow}
                  disabled={submittingCompletion}
                >
                  + Add another medication
                </button>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="prescription-notes">
                    Instructions for patient (optional)
                  </label>
                  <textarea
                    id="prescription-notes"
                    rows={4}
                    value={prescriptionForm.notes}
                    onChange={(event) =>
                      setPrescriptionForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Extra guidance, follow-up reminders, or precautions"
                    className="w-full rounded-xl border border-border px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={submittingCompletion}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
              <button
                type="button"
                onClick={closeCompletionModal}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground transition hover:border-muted-foreground"
                disabled={submittingCompletion}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => completeAppointment({ withLabRequest: false })}
                className="rounded-full border border-(--action-success) px-5 py-2 text-sm font-semibold text-(--action-success) transition hover:bg-(--action-success)/10 disabled:cursor-not-allowed"
                disabled={submittingCompletion}
              >
                {submittingCompletion ? "Saving..." : "Mark complete"}
              </button>
              <button
                type="button"
                onClick={() => completeAppointment({ withLabRequest: true })}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed"
                disabled={submittingCompletion}
              >
                {submittingCompletion ? "Submitting..." : "Complete & send lab request"}
              </button>
              <button
                type="button"
                onClick={() => completeAppointment({ withPrescription: true })}
                className="rounded-full bg-(--pill-info-bg) px-5 py-2 text-sm font-semibold text-(--pill-info-fg) shadow transition hover:opacity-90 disabled:cursor-not-allowed"
                disabled={submittingCompletion}
              >
                {submittingCompletion ? "Submitting..." : "Complete & send prescription"}
              </button>
              <button
                type="button"
                onClick={() => completeAppointment({ withLabRequest: true, withPrescription: true })}
                className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background shadow transition hover:opacity-90 disabled:cursor-not-allowed"
                disabled={submittingCompletion}
              >
                {submittingCompletion ? "Submitting..." : "Complete with lab & Rx"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage
