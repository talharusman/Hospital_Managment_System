"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { billingAPI, staffAPI } from "../../services/api"
import toast from "react-hot-toast"
import { CheckCircle, Plus, Save, Trash2 } from "lucide-react"

export const CreateInvoicePage = () => {
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [{ description: "", amount: "" }],
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [activeSuggestionField, setActiveSuggestionField] = useState(null)
  const suggestionCloseTimeout = useRef(null)

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", amount: "" }],
    })
  }

  useEffect(() => {
    let isMounted = true

    const fetchPatients = async () => {
      setPatientsLoading(true)
      try {
        const { data } = await staffAPI.getPatients()
        if (!isMounted) return
        const payload = Array.isArray(data?.patients) ? data.patients : []
        setPatients(payload)
      } catch (error) {
        if (isMounted) {
          setPatients([])
          toast.error(error?.response?.data?.message || "Failed to load patients for lookup")
        }
      } finally {
        if (isMounted) {
          setPatientsLoading(false)
        }
      }
    }

    fetchPatients()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (suggestionCloseTimeout.current) {
        clearTimeout(suggestionCloseTimeout.current)
      }
    }
  }, [])

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0)
  }

  const cancelSuggestionClose = () => {
    if (suggestionCloseTimeout.current) {
      clearTimeout(suggestionCloseTimeout.current)
      suggestionCloseTimeout.current = null
    }
  }

  const scheduleSuggestionClose = () => {
    cancelSuggestionClose()
    suggestionCloseTimeout.current = setTimeout(() => {
      setActiveSuggestionField(null)
    }, 120)
  }

  const suggestionQuery = useMemo(() => {
    if (activeSuggestionField === "id") {
      return formData.patientId.trim().toLowerCase()
    }
    if (activeSuggestionField === "name") {
      return formData.patientName.trim().toLowerCase()
    }
    return ""
  }, [activeSuggestionField, formData.patientId, formData.patientName])

  const patientSuggestions = useMemo(() => {
    if (!patients.length || !activeSuggestionField) {
      return []
    }

    if (!suggestionQuery) {
      return patients.slice(0, 8)
    }

    return patients
      .filter((patient) => {
        const haystack = `${patient.id} ${patient.name} ${patient.email}`.toLowerCase()
        return haystack.includes(suggestionQuery)
      })
      .slice(0, 8)
  }, [activeSuggestionField, patients, suggestionQuery])

  const handlePatientSelect = (patient) => {
    cancelSuggestionClose()
    setSelectedPatient(patient)
    setFormData((prev) => ({
      ...prev,
      patientId: String(patient.id),
      patientName: patient.name,
    }))
    setActiveSuggestionField(null)
  }

  const handlePatientNameInput = (event) => {
    const value = event.target.value
    const matchingPatient = patients.find((patient) => patient.name.toLowerCase() === value.trim().toLowerCase())

    setFormData((prev) => ({
      ...prev,
      patientName: value,
      patientId: matchingPatient ? String(matchingPatient.id) : "",
    }))

    setSelectedPatient(matchingPatient || null)
    cancelSuggestionClose()
    setActiveSuggestionField("name")
  }

  const handlePatientIdInput = (event) => {
    const sanitized = event.target.value.replace(/[^0-9]/g, "")
    const matchingPatient = patients.find((patient) => String(patient.id) === sanitized)

    setFormData((prev) => ({
      ...prev,
      patientId: sanitized,
      patientName: matchingPatient ? matchingPatient.name : "",
    }))

    setSelectedPatient(matchingPatient || null)
    cancelSuggestionClose()
    setActiveSuggestionField("id")
  }

  const handlePatientFieldFocus = (field) => {
    cancelSuggestionClose()
    setActiveSuggestionField(field)
  }

  const handlePatientFieldBlur = () => {
    scheduleSuggestionClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const patientIdValue = Number.parseInt(formData.patientId, 10)
    if (Number.isNaN(patientIdValue) || patientIdValue <= 0) {
      toast.error("Enter a valid patient ID")
      return
    }

    const totalAmount = Number.parseFloat(calculateTotal().toFixed(2))
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      toast.error("Add at least one valid invoice item")
      return
    }

    const lineSummary = formData.items
      .filter((item) => item.description)
      .map((item) => `${item.description} (${Number.parseFloat(item.amount || 0).toFixed(2)})`)
      .join("; ")

    const descriptionParts = [lineSummary]
    if (formData.notes) {
      descriptionParts.push(`Notes: ${formData.notes}`)
    }

    const payload = {
      patient_id: patientIdValue,
      amount: totalAmount,
      description: descriptionParts.filter(Boolean).join(" | ") || "Invoice generated",
      due_date: formData.dueDate || null,
    }

    setLoading(true)
    try {
      const { data } = await billingAPI.createInvoice(payload)
      toast.success(data?.message || "Invoice created successfully")
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          patientId: "",
          patientName: "",
          date: new Date().toISOString().split("T")[0],
          dueDate: "",
          items: [{ description: "", amount: "" }],
          notes: "",
        })
        setSelectedPatient(null)
      }, 3000)
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create invoice")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Invoice Created!</h2>
          <p className="text-muted-foreground">The invoice has been created successfully. Redirecting...</p>
        </div>
      </div>
    )
  }

  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 text-foreground">
      <h1 className="text-3xl font-semibold mb-8">Create New Invoice</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-8 shadow-sm">
          {/* Patient Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Patient ID"
                  value={formData.patientId}
                  onChange={handlePatientIdInput}
                  onFocus={() => handlePatientFieldFocus("id")}
                  onBlur={handlePatientFieldBlur}
                  autoComplete="off"
                  required
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {activeSuggestionField === "id" && (patientsLoading || patientSuggestions.length > 0) && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
                    {patientsLoading ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Loading patients…</div>
                    ) : (
                      patientSuggestions.map((patient) => (
                        <button
                          key={`id-${patient.id}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handlePatientSelect(patient)}
                          className="flex w-full flex-col items-start gap-1 px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted/60"
                        >
                          <span className="font-semibold text-foreground">ID {patient.id}</span>
                          <span className="text-xs text-muted-foreground">{patient.name} · {patient.email}</span>
                        </button>
                      ))
                    )}
                    {!patientsLoading && patientSuggestions.length === 0 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground">No patient found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder={patientsLoading ? "Loading patients..." : "Patient name"}
                  value={formData.patientName}
                  onChange={handlePatientNameInput}
                  onFocus={() => handlePatientFieldFocus("name")}
                  onBlur={handlePatientFieldBlur}
                  autoComplete="off"
                  required
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {activeSuggestionField === "name" && (patientsLoading || patientSuggestions.length > 0) && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
                    {patientsLoading ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Loading patients…</div>
                    ) : (
                      patientSuggestions.map((patient) => (
                        <button
                          key={`name-${patient.id}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handlePatientSelect(patient)}
                          className="flex w-full flex-col items-start gap-1 px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted/60"
                        >
                          <span className="font-semibold text-foreground">{patient.name}</span>
                          <span className="text-xs text-muted-foreground">ID {patient.id} · {patient.email}</span>
                        </button>
                      ))
                    )}
                    {!patientsLoading && patientSuggestions.length === 0 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground">No patient found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {selectedPatient && (
              <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
                <p className="text-sm font-semibold text-primary">{selectedPatient.name}</p>
                <p className="text-xs">ID {selectedPatient.id} · {selectedPatient.email}</p>
                <div className="mt-2 space-y-1">
                  {selectedPatient.phone && <p>Phone: {selectedPatient.phone}</p>}
                  {selectedPatient.gender && <p>Gender: {selectedPatient.gender}</p>}
                  {selectedPatient.dateOfBirth && <p>DOB: {selectedPatient.dateOfBirth}</p>}
                  {selectedPatient.address && <p>Address: {selectedPatient.address}</p>}
                  {selectedPatient.emergencyContact && <p>Emergency: {selectedPatient.emergencyContact}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Invoice Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Issue Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Invoice Items</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 text-primary transition hover:text-primary/90"
              >
                <Plus size={20} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    required
                    className="flex-1 rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                    step="0.01"
                    required
                    className="w-32 rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Notes</label>
            <textarea
              placeholder="Additional notes or payment instructions"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="h-24 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            ></textarea>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="sticky top-8 h-fit rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Invoice Summary</h2>

            <div className="space-y-3 mb-6 text-sm">
              <div>
                <p className="text-muted-foreground">Patient</p>
                <p className="font-semibold text-foreground">{formData.patientName || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Issue Date</p>
                <p className="font-semibold text-foreground">{formData.date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Due Date</p>
                <p className="font-semibold text-foreground">{formData.dueDate || "-"}</p>
              </div>
            </div>

            {/* Item Summary */}
            <div className="mb-6 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {formData.items.map(
                  (item, idx) =>
                    item.description && (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.description}</span>
                        <span className="font-semibold text-foreground">
                          ${Number.parseFloat(item.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    ),
                )}
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-semibold text-foreground">Total:</span>
                <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted"
            >
              <Save size={20} /> {loading ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
export default CreateInvoicePage