"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Plus, Edit2, Trash2, Search, Loader2, Hash, LineChart, UserRound, CalendarClock, X } from "lucide-react"

import { pharmacyAPI } from "../../services/api"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

const defaultFormValues = {
  name: "",
  generic_name: "",
  batch_number: "",
  expiry_date: "",
  quantity: "",
  unit_price: "",
  supplier_id: "",
}

const toNumberOr = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toOptionalNumber = (value) => {
  const trimmed = `${value ?? ""}`.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeCurrency = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const parsePrescriptionNotes = (notes) => {
  if (!notes) return []

  if (Array.isArray(notes)) return notes

  let payload = notes
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload)
    } catch (error) {
      return []
    }
  }

  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.medications)) return payload.medications
  return []
}

const formatPrescriptionDate = (value) => {
  if (!value) return "-"
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value))
  } catch (error) {
    return value
  }
}

export const MedicinesPage = () => {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState(defaultFormValues)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [activeDetailTab, setActiveDetailTab] = useState("inventory")
  const [prescriptions, setPrescriptions] = useState([])
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)
  const [prescriptionError, setPrescriptionError] = useState(null)
  const [billingDrafts, setBillingDrafts] = useState({})
  const [isProcessingBilling, setIsProcessingBilling] = useState(false)

  useEffect(() => {
    fetchMedicines()
  }, [])

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchMedicines = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await pharmacyAPI.getMedicines()
      setMedicines(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load medicines"
      setError(message)
      toast.error(message)
      setMedicines([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true)
      setPrescriptionError(null)
      const { data } = await pharmacyAPI.getPrescriptionOptions()
      setPrescriptions(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load prescriptions"
      setPrescriptionError(message)
      toast.error(message)
      setPrescriptions([])
    } finally {
      setLoadingPrescriptions(false)
    }
  }

  const buildMatchKey = (prescriptionId, index) => `${prescriptionId}-${index}`

  const matchingPrescriptions = useMemo(() => {
    if (!selectedMedicine) return []

    const searchableNames = [selectedMedicine.name, selectedMedicine.generic_name]
      .map((value) => (value || "").toLowerCase())
      .filter(Boolean)

    if (searchableNames.length === 0) return []

    return prescriptions.flatMap((prescription) => {
      const medications = parsePrescriptionNotes(prescription.notes)
      if (!medications.length) return []

      return medications
        .map((medication, index) => ({ medication, index }))
        .filter(({ medication }) => {
          const medName = (medication.name || "").toLowerCase()
          if (!medName) return false
          return searchableNames.some((needle) => medName.includes(needle) || needle.includes(medName))
        })
        .map(({ medication, index }) => ({
          key: buildMatchKey(prescription.id, index),
          prescription,
          medication,
          medicationIndex: index,
        }))
    })
  }, [prescriptions, selectedMedicine])

  const handleBillingInputChange = (key, field, value) => {
    setBillingDrafts((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  const handleDispenseAndBill = async (match) => {
    if (isProcessingBilling || !selectedMedicine) return

    const draft = billingDrafts[match.key] || {}
    const quantity = Number(draft.quantity)

    if (!quantity || Number.isNaN(quantity) || quantity <= 0) {
      toast.error("Enter a valid quantity to dispense and bill")
      return
    }

    const currentStock = Number(selectedMedicine.quantity) || 0
    if (quantity > currentStock) {
      toast.error("Requested quantity exceeds current stock")
      return
    }

    const unitPrice = normalizeCurrency(selectedMedicine.unit_price)
    const amount = Number((unitPrice * quantity).toFixed(2))

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      toast.error("Set a valid unit price before dispensing")
      return
    }

    const updatedQuantity = Math.max(currentStock - quantity, 0)

    try {
      setIsProcessingBilling(true)

      const descriptionLine = `Pharmacy charge: ${selectedMedicine.name} x${quantity} ($${amount.toFixed(2)}) for ${match.prescription.patient_name}`

      const { data } = await pharmacyAPI.dispenseMedicine({
        prescriptionId: match.prescription.id,
        medicineId: selectedMedicine.id,
        quantity,
        billAmount: amount,
        description: descriptionLine,
        billingDueDate: draft.dueDate || null,
      })

      const invoiceAction = data?.invoiceAction

      const responseMessage =
        data?.message ||
        (invoiceAction?.type === "updated"
          ? "Dispensed and updated pending invoice"
          : invoiceAction?.type === "created"
            ? "Dispensed and created new invoice"
            : "Medicine dispensed successfully")

      toast.success(responseMessage)

      const remainingStock = Number.isFinite(data?.remainingStock)
        ? data.remainingStock
        : updatedQuantity

      setBillingDrafts((prev) => ({
        ...prev,
        [match.key]: {
          ...prev[match.key],
          quantity: "",
        },
      }))

      setMedicines((prev) =>
        prev.map((medicine) =>
          medicine.id === selectedMedicine.id ? { ...medicine, quantity: remainingStock } : medicine,
        ),
      )

      setSelectedMedicine((prev) => (prev ? { ...prev, quantity: remainingStock } : prev))
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to dispense and update invoice. No changes were applied."
      toast.error(message)
    } finally {
      setIsProcessingBilling(false)
    }
  }

  const handleFormOpen = (medicine = null) => {
    setSelectedMedicine(null)
    if (medicine) {
      setFormData({
        name: medicine.name || "",
        generic_name: medicine.generic_name || "",
        batch_number: medicine.batch_number || "",
        expiry_date: medicine.expiry_date ? medicine.expiry_date.slice(0, 10) : "",
        quantity: medicine.quantity ?? "",
        unit_price: medicine.unit_price ?? "",
        supplier_id: medicine.supplier_id ?? "",
      })
      setEditingId(medicine.id)
    } else {
      setFormData(defaultFormValues)
      setEditingId(null)
    }
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(defaultFormValues)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      const payload = {
        name: formData.name.trim(),
        generic_name: formData.generic_name.trim() || null,
        batch_number: formData.batch_number.trim() || null,
        expiry_date: formData.expiry_date || null,
        quantity: toNumberOr(formData.quantity, 0),
        unit_price: toNumberOr(formData.unit_price, 0),
        supplier_id: toOptionalNumber(formData.supplier_id),
      }

      if (editingId) {
        await pharmacyAPI.updateMedicine(editingId, payload)
        toast.success("Medicine updated successfully")
      } else {
        await pharmacyAPI.createMedicine(payload)
        toast.success("Medicine added successfully")
      }

      resetForm()
      await fetchMedicines()
    } catch (err) {
      const message = err.response?.data?.message || "Unable to save medicine"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this medicine from inventory?")
    if (!confirmed) return
    try {
      await pharmacyAPI.deleteMedicine(id)
      toast.success("Medicine removed")
      setMedicines((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete medicine"
      toast.error(message)
    }
  }

  const filteredMedicines = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return medicines
    return medicines.filter((medicine) => {
      const name = medicine.name?.toLowerCase() || ""
      const genericName = medicine.generic_name?.toLowerCase() || ""
      const batchNumber = medicine.batch_number?.toLowerCase() || ""
      return name.includes(term) || genericName.includes(term) || batchNumber.includes(term)
    })
  }, [medicines, searchTerm])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} />

  return (
    <>
      <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medicine Inventory</h1>
          <p className="text-muted-foreground">Maintain accurate stock levels and essential medicine details.</p>
        </div>
        <button
          type="button"
          onClick={() => handleFormOpen()}
          className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus size={18} /> Add Medicine
        </button>
      </div>

      <div className="mb-6">
        <label className="sr-only" htmlFor="medicine-search">
          Search medicines
        </label>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          <input
            id="medicine-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, generic name, or batch number"
            className="w-full rounded-xl border border-border/70 bg-card/80 px-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {filteredMedicines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No medicines match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMedicines.map((medicine) => (
            <button
              key={medicine.id}
              type="button"
              onClick={() => {
                setSelectedMedicine(medicine)
                setActiveDetailTab("inventory")
                setBillingDrafts({})
              }}
              className="flex h-full w-full flex-col rounded-2xl border border-border bg-card/90 p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-lg font-semibold text-foreground">{medicine.name}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    (Number(medicine.quantity) || 0) < 10
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {medicine.quantity ?? 0} in stock
                </span>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tap to view details</p>
            </button>
          ))}
        </div>
      )}

        {selectedMedicine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelectedMedicine(null)}>
            <div
              className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{selectedMedicine.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedMedicine.generic_name || "No generic name recorded"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMedicine(null)}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-xl bg-muted/30 p-1">
                {[
                  { id: "inventory", label: "Inventory" },
                  { id: "orders", label: "Prescription Orders" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      activeDetailTab === tab.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeDetailTab === "inventory" ? (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash size={16} />
                        <span>Batch number</span>
                      </div>
                      <p className="text-base font-semibold text-foreground">{selectedMedicine.batch_number || "Not provided"}</p>
                    </div>
                    <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarClock size={16} />
                        <span>Expiry date</span>
                      </div>
                      <p className="text-base font-semibold text-foreground">{selectedMedicine.expiry_date || "Not specified"}</p>
                    </div>
                    <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LineChart size={16} />
                        <span>Unit price</span>
                      </div>
                      <p className="text-base font-semibold text-foreground">
                        {normalizeCurrency(selectedMedicine.unit_price).toLocaleString(undefined, {
                          style: "currency",
                          currency: "USD",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Inventory value {normalizeCurrency((Number(selectedMedicine.unit_price) || 0) * (Number(selectedMedicine.quantity) || 0)).toLocaleString(undefined, {
                          style: "currency",
                          currency: "USD",
                        })}
                      </p>
                    </div>
                    <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserRound size={16} />
                        <span>Supplier</span>
                      </div>
                      <p className="text-base font-semibold text-foreground">{selectedMedicine.supplier_id || "Not linked"}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/40 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity in stock</p>
                      <p className="text-2xl font-semibold text-foreground">{selectedMedicine.quantity ?? 0}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleFormOpen(selectedMedicine)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedMedicine.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {loadingPrescriptions
                        ? "Loading prescription details…"
                        : `${matchingPrescriptions.length} matching ${matchingPrescriptions.length === 1 ? "prescription" : "prescriptions"}`}
                    </p>
                    <button
                      type="button"
                      onClick={fetchPrescriptions}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                      disabled={loadingPrescriptions}
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingPrescriptions ? (
                    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading prescriptions…
                    </div>
                  ) : prescriptionError ? (
                    <div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                      <p>{prescriptionError}</p>
                      <button
                        type="button"
                        onClick={fetchPrescriptions}
                        className="rounded-lg border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                      >
                        Try again
                      </button>
                    </div>
                  ) : matchingPrescriptions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                      No prescriptions referencing this medicine yet.
                    </div>
                  ) : (
                    matchingPrescriptions.map((match) => {
                      const draft = billingDrafts[match.key] || {}

                      const detailsLine = [match.medication.dosage, match.medication.frequency, match.medication.duration]
                        .filter(Boolean)
                        .join(" • ")

                      return (
                        <div key={match.key} className="space-y-4 rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-foreground">{match.prescription.patient_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Prescription #{match.prescription.id} • {formatPrescriptionDate(match.prescription.prescription_date)}
                              </p>
                            </div>
                            <span className="rounded-full border border-border/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {match.prescription.status || "pending"}
                            </span>
                          </div>

                          <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
                            <p className="font-semibold text-foreground">{match.medication.name}</p>
                            <p className="text-muted-foreground">{detailsLine || "No additional instructions"}</p>
                            {match.prescription.doctor_name && (
                              <p className="mt-2 text-xs text-muted-foreground">Prescribed by {match.prescription.doctor_name}</p>
                            )}
                          </div>

                          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Quantity to dispense</label>
                              <input
                                type="number"
                                min="1"
                                value={draft.quantity || ""}
                                onChange={(event) => handleBillingInputChange(match.key, "quantity", event.target.value)}
                                className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder="Units"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Invoice due date (optional)</label>
                              <input
                                type="date"
                                value={draft.dueDate || ""}
                                onChange={(event) => handleBillingInputChange(match.key, "dueDate", event.target.value)}
                                className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDispenseAndBill(match)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                              disabled={isProcessingBilling}
                            >
                              {isProcessingBilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />} Dispense &amp; Bill
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={resetForm}>
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{editingId ? "Edit medicine" : "Add new medicine"}</h2>
                <p className="text-sm text-muted-foreground">Provide the essential inventory details for this medicine.</p>
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
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Medicine name</label>
                <input
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Generic name</label>
                <input
                  value={formData.generic_name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, generic_name: event.target.value }))}
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Batch number</label>
                <input
                  value={formData.batch_number}
                  onChange={(event) => setFormData((prev) => ({ ...prev, batch_number: event.target.value }))}
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Expiry date</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(event) => setFormData((prev) => ({ ...prev, expiry_date: event.target.value }))}
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Quantity in stock</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Unit price (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(event) => setFormData((prev) => ({ ...prev, unit_price: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-border/70 bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Supplier ID (optional)</label>
                <input
                  value={formData.supplier_id}
                  onChange={(event) => setFormData((prev) => ({ ...prev, supplier_id: event.target.value }))}
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
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editingId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default MedicinesPage