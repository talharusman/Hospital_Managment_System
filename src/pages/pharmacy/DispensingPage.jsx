"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Plus, Save, Loader2, UserRound, Pill, CalendarClock, ClipboardList, X } from "lucide-react"

import { pharmacyAPI } from "../../services/api"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

const defaultFormValues = {
  prescriptionId: "",
  medicineId: "",
  quantity: "",
  notes: "",
}

const formatDateTime = (value) => {
  if (!value) return "-"
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

export const DispensingPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dispensingHistory, setDispensingHistory] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [medicines, setMedicines] = useState([])
  const [formData, setFormData] = useState(defaultFormValues)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchDispensingData()
  }, [])

  const fetchDispensingData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [historyRes, prescriptionsRes, medicinesRes] = await Promise.all([
        pharmacyAPI.getDispensingHistory(),
        pharmacyAPI.getPrescriptionOptions(),
        pharmacyAPI.getMedicines(),
      ])

      setDispensingHistory(Array.isArray(historyRes.data) ? historyRes.data : [])
      setPrescriptions(Array.isArray(prescriptionsRes.data) ? prescriptionsRes.data : [])
      setMedicines(Array.isArray(medicinesRes.data) ? medicinesRes.data : [])
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load dispensing data"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setFormData(defaultFormValues)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const prescriptionId = Number(formData.prescriptionId)
    const medicineId = Number(formData.medicineId)
    const quantity = Number(formData.quantity)

    if (!prescriptionId || !medicineId || !quantity) {
      toast.error("Prescription, medicine, and quantity are required")
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        prescriptionId,
        medicineId,
        quantity,
        notes: formData.notes.trim() || undefined,
      }

      const { data } = await pharmacyAPI.dispenseMedicine(payload)
      toast.success(data?.message || "Medicine dispensed successfully")

      if (data?.record) {
        setDispensingHistory((prev) => [data.record, ...prev])
        setSelectedRecord(data.record)
      } else {
        await fetchDispensingData()
      }

      resetForm()
    } catch (err) {
      const message = err.response?.data?.message || "Failed to dispense medicine"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalUnitsDispensed = useMemo(() => {
    return dispensingHistory.reduce((sum, item) => sum + (Number(item.quantity_dispensed) || 0), 0)
  }, [dispensingHistory])

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return dispensingHistory
    const query = searchTerm.trim().toLowerCase()
    return dispensingHistory.filter((record) => {
      const patient = record.patient_name?.toLowerCase() || `patient #${record.patient_id}`.toLowerCase()
      const medicine = record.medicine_name?.toLowerCase() || `medicine #${record.medicine_id}`.toLowerCase()
      return patient.includes(query) || medicine.includes(query)
    })
  }, [dispensingHistory, searchTerm])

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "—"
    const amount = Number(value)
    return Number.isNaN(amount)
      ? "—"
      : amount.toLocaleString(undefined, { style: "currency", currency: "USD" })
  }

  const selectedMedicine = useMemo(() => {
    if (!selectedRecord) return null
    return medicines.find((item) => item.id === selectedRecord.medicine_id) || null
  }, [medicines, selectedRecord])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchDispensingData} />

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dispensing</h1>
          <p className="text-muted-foreground">Record dispensed medicines and review the latest activity.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus size={18} /> Dispense Medicine
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
          <UserRound size={16} className="text-muted-foreground" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Records</p>
            <p className="text-base font-semibold text-foreground">{dispensingHistory.length}</p>
          </div>
          <div className="ml-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Units dispensed</p>
            <p className="text-base font-semibold text-foreground">{totalUnitsDispensed}</p>
          </div>
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by patient or medicine"
          className="w-full max-w-sm rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={resetForm}>
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">New dispensing record</h2>
                <p className="text-sm text-muted-foreground">Record the prescription, medicine, and quantity dispensed.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Prescription</label>
                <select
                  value={formData.prescriptionId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, prescriptionId: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select prescription</option>
                  {prescriptions.map((prescription) => (
                    <option key={prescription.id} value={prescription.id}>
                      #{prescription.id} • {prescription.patient_name} • {formatDateTime(prescription.prescription_date)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Medicine</label>
                <select
                  value={formData.medicineId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, medicineId: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select medicine</option>
                  {medicines.map((medicine) => (
                    <option key={medicine.id} value={medicine.id}>
                      {medicine.name} • In stock: {medicine.quantity ?? 0}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />} Dispense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Dispensing history</h2>
            <p className="text-sm text-muted-foreground">{dispensingHistory.length} records • {totalUnitsDispensed} units dispensed</p>
          </div>
          <button
            type="button"
            onClick={fetchDispensingData}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
          >
            Refresh
          </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No dispensing records match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredHistory.map((record) => (
            <div key={record.id}>
              <button
                type="button"
                onClick={() => setSelectedRecord(record)}
                className="flex h-full w-full flex-col rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{record.patient_name || `Patient #${record.patient_id}`}</p>
                  <p className="text-sm text-muted-foreground">{record.medicine_name || `Medicine #${record.medicine_id}`}</p>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  View details
                </p>
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelectedRecord(null)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedRecord.patient_name || `Patient #${selectedRecord.patient_id}`}</h2>
                <p className="text-sm text-muted-foreground">Dispensed on {formatDateTime(selectedRecord.dispensed_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <ClipboardList size={16} />
                  <span className="font-medium text-foreground">Prescription #{selectedRecord.prescription_id}</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-card/80 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Pill size={16} />
                    <span>Medicine</span>
                  </div>
                    <p className="text-base font-semibold text-foreground">{selectedRecord.medicine_name || `Medicine #${selectedRecord.medicine_id}`}</p>
                    <p className="text-sm text-muted-foreground">
                      Batch {selectedMedicine?.batch_number || "N/A"}
                    </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/80 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <UserRound size={16} />
                    <span>Pharmacist</span>
                  </div>
                  <p className="text-base font-semibold text-foreground">{selectedRecord.pharmacist_name || "System"}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity dispensed</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{selectedRecord.quantity_dispensed ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Unit price</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(selectedRecord.medicine_unit_price ?? selectedMedicine?.unit_price)}</p>
                  <p className="text-xs text-muted-foreground">
                    Total {formatCurrency(((Number(selectedRecord.medicine_unit_price ?? selectedMedicine?.unit_price) || 0) * (Number(selectedRecord.quantity_dispensed) || 0))) }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DispensingPage