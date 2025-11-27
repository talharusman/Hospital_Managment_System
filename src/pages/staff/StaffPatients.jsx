"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Search,
  RefreshCw,
  Mail,
  Phone,
  CalendarDays,
  UserRound,
  X,
  Droplet,
  ShieldCheck,
  UserPlus,
  Pencil,
  Lock,
} from "lucide-react"
import toast from "react-hot-toast"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"
import { staffAPI } from "../../services/api"

const formatDate = (value) => {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch (error) {
    return value
  }
}

const describeRecency = (value) => {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const diffDays = Math.round((Date.now() - target.getTime()) / 86400000)
  if (diffDays <= 0) return "Joined today"
  if (diffDays === 1) return "Joined yesterday"
  if (diffDays < 7) return `Joined ${diffDays} days ago`
  if (diffDays < 30) return `Joined ${Math.round(diffDays / 7)} weeks ago`
  return null
}

const emptyFormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  bloodType: "",
  address: "",
  emergencyContact: "",
}

const formatDateForInput = (value) => {
  if (!value) return ""
  const stringValue = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue
  }
  if (stringValue.length >= 10) {
    return stringValue.slice(0, 10)
  }
  const parsed = new Date(stringValue)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }
  return parsed.toISOString().slice(0, 10)
}

export const StaffPatients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [recentOnly, setRecentOnly] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState("create")
  const [formData, setFormData] = useState(emptyFormState)
  const [formErrors, setFormErrors] = useState({})
  const [editingPatientId, setEditingPatientId] = useState(null)
  const [submittingForm, setSubmittingForm] = useState(false)
  const isCreateMode = formMode === "create"

  const themeFallbackVars = {
    "--appointment-card": "rgba(11, 19, 42, 0.08)",
    "--appointment-card-border": "rgba(11, 19, 42, 0.16)",
  }

  const fetchPatients = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
        setError(null)
      }

      const { data } = await staffAPI.getPatients()
      const normalized = Array.isArray(data?.patients) ? data.patients : []
      setPatients(normalized)
    } catch (err) {
      const message = err.response?.data?.message || "Unable to load patients"
      if (silent) {
        toast.error(message)
      } else {
        setError(message)
        toast.error(message)
      }
    } finally {
      if (silent) {
        setIsRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null
    return patients.find((patient) => patient.id === selectedPatientId) || null
  }, [patients, selectedPatientId])

  const filteredPatients = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return patients.filter((patient) => {
      if (genderFilter !== "all" && patient.gender?.toLowerCase() !== genderFilter) {
        return false
      }

      if (recentOnly) {
        const registered = patient.registeredAt ? new Date(patient.registeredAt) : null
        if (!registered || registered < weekAgo) {
          return false
        }
      }

      if (!searchTerm.trim()) {
        return true
      }

      const term = searchTerm.trim().toLowerCase()
      const haystack = [patient.name, patient.email, patient.phone, patient.address]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())

      return haystack.some((value) => value.includes(term))
    })
  }, [patients, searchTerm, genderFilter, recentOnly])

  const genderFilters = [
    { label: "All", value: "all" },
    { label: "Female", value: "female" },
    { label: "Male", value: "male" },
    { label: "Other", value: "other" },
  ]

  const handleRefresh = async () => {
    await fetchPatients({ silent: true })
    toast.success("Patient list refreshed")
  }

  const closeDetails = () => setSelectedPatientId(null)

  const handleCopy = async (value, label) => {
    if (!value) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
        toast.success(`${label} copied`)
      } else {
        throw new Error("Clipboard unavailable")
      }
    } catch (err) {
      toast.error(`Unable to copy ${label.toLowerCase()}`)
    }
  }

  const openCreateForm = () => {
    setFormMode("create")
    setFormData(emptyFormState)
    setFormErrors({})
    setEditingPatientId(null)
    setIsFormOpen(true)
  }

  const startEditPatient = (patient) => {
    if (!patient) return
    setFormMode("edit")
    setFormErrors({})
    setEditingPatientId(patient.id)
    setFormData({
      name: patient.name || "",
      email: patient.email || "",
      password: "",
      phone: patient.phone || "",
      gender: patient.gender ? patient.gender.toLowerCase() : "",
      dateOfBirth: formatDateForInput(patient.dateOfBirth),
      bloodType: patient.bloodType || "",
      address: patient.address || "",
      emergencyContact: patient.emergencyContact || "",
    })
    setIsFormOpen(true)
  }

  const handleEditSelectedPatient = () => {
    if (!selectedPatient) return
    closeDetails()
    startEditPatient(selectedPatient)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setFormMode("create")
    setFormData(emptyFormState)
    setFormErrors({})
    setEditingPatientId(null)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => {
      if (!prev || !prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const handleFormSubmit = async (event) => {
    event.preventDefault()

    const errors = {}
    const trimmedName = formData.name.trim()
    const trimmedEmail = formData.email.trim().toLowerCase()

    if (!trimmedName) {
      errors.name = "Name is required"
    }
    if (!trimmedEmail) {
      errors.email = "Email is required"
    }

    if (formMode === "create") {
      const trimmedPassword = formData.password.trim()
      if (trimmedPassword.length < 6) {
        errors.password = "Password must be at least 6 characters"
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSubmittingForm(true)

    const sanitize = (value) => (typeof value === "string" ? value.trim() : value)
    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      phone: sanitize(formData.phone) || null,
      gender: formData.gender || null,
      dateOfBirth: formData.dateOfBirth || null,
      bloodType: sanitize(formData.bloodType) || null,
      address: sanitize(formData.address) || null,
      emergencyContact: sanitize(formData.emergencyContact) || null,
    }

    if (formMode === "create") {
      payload.password = formData.password.trim()
    }

    try {
      let response
      const fallbackId = editingPatientId

      if (formMode === "create") {
        response = await staffAPI.createPatient(payload)
      } else {
        if (!editingPatientId) {
          throw new Error("Missing patient reference")
        }
        response = await staffAPI.updatePatient(editingPatientId, payload)
      }

      const createdOrUpdatedId = response?.data?.patient?.id || (formMode === "edit" ? fallbackId : null)

      await fetchPatients({ silent: true })

      if (createdOrUpdatedId) {
        setSelectedPatientId(createdOrUpdatedId)
      }

      toast.success(formMode === "create" ? "Patient registered successfully" : "Patient details updated")
      closeForm()
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to save patient"
      toast.error(message)
    } finally {
      setSubmittingForm(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchPatients} />

  const emptyMessage = searchTerm.trim() || genderFilter !== "all" || recentOnly
    ? "No patients match the current filters."
    : "No patients found yet."

  return (
    <div className="min-h-screen bg-background p-6 md:p-10" style={themeFallbackVars}>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patient management</h1>
          <p className="text-sm text-muted-foreground">
            Review registered patients, update contacts, and open their profiles in one place.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, or phone"
              className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500/15"
          >
            <UserPlus className="h-4 w-4" />
            Register patient
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {genderFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setGenderFilter(filter.value)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              genderFilter === filter.value
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-muted/40 text-foreground hover:bg-muted"
            }`}
          >
            {filter.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRecentOnly((prev) => !prev)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
            recentOnly
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
              : "border-border bg-muted/40 text-foreground hover:bg-muted"
          }`}
        >
          Recent arrivals
        </button>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/60 py-16 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPatients.map((patient) => {
            const badgeClass =
              patient.gender?.toLowerCase() === "female"
                ? "bg-fuchsia-500/15 text-fuchsia-500"
                : patient.gender?.toLowerCase() === "male"
                  ? "bg-sky-500/15 text-sky-500"
                  : "bg-muted/60 text-muted-foreground"

            const recencyLabel = describeRecency(patient.registeredAt)

            return (
              <div key={patient.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPatientId(patient.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedPatientId(patient.id)
                    }
                  }}
                  className="flex h-full cursor-pointer flex-col rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Patient #{patient.id}</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{patient.name || "Unknown"}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "Unknown"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <Mail size={16} />
                      <span>{patient.email || "No email"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone size={16} />
                      <span>{patient.phone || "No phone"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <CalendarDays size={16} />
                      <span>{recencyLabel || "Registration date unavailable"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={closeDetails}>
          <div
            className="w-full max-w-3xl rounded-3xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedPatient.name || "Patient"}</h2>
                <p className="text-sm text-muted-foreground">Profile overview</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEditSelectedPatient}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                  aria-label="Close details"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
                <UserRound size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Contact</p>
                  <div className="mt-2 space-y-2 text-sm text-foreground">
                    <p className="font-semibold">{selectedPatient.email || "No email on file"}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {selectedPatient.email && (
                        <a
                          href={`mailto:${selectedPatient.email}`}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-muted-foreground transition hover:border-primary hover:text-primary"
                        >
                          Email
                        </a>
                      )}
                      {selectedPatient.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedPatient.email, "Email")}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-muted-foreground transition hover:border-primary hover:text-primary"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
                <Phone size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Phone</p>
                  <div className="mt-2 space-y-2 text-sm text-foreground">
                    <p className="font-semibold">{selectedPatient.phone || "No phone on file"}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {selectedPatient.phone && (
                        <a
                          href={`tel:${selectedPatient.phone}`}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-muted-foreground transition hover:border-primary hover:text-primary"
                        >
                          Call
                        </a>
                      )}
                      {selectedPatient.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedPatient.phone, "Phone number")}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-muted-foreground transition hover:border-primary hover:text-primary"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Demographics</p>
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  <span className="flex items-center gap-2">
                    <Droplet size={16} className="text-primary" /> Blood type: {selectedPatient.bloodType || "—"}
                  </span>
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" /> Gender: {selectedPatient.gender || "—"}
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-primary" /> DOB: {formatDate(selectedPatient.dateOfBirth)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Address</p>
                <p className="mt-2 text-sm text-foreground">{selectedPatient.address || "No address recorded"}</p>
                {selectedPatient.emergencyContact && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Emergency: {selectedPatient.emergencyContact}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={closeForm}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {isCreateMode ? (
                  <UserPlus className="h-10 w-10 rounded-2xl bg-emerald-500/10 p-2 text-emerald-500" />
                ) : (
                  <Pencil className="h-10 w-10 rounded-2xl bg-primary/10 p-2 text-primary" />
                )}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {isCreateMode ? "Register new patient" : "Edit patient profile"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isCreateMode
                      ? "Create a patient portal account and optionally capture contact details."
                      : "Update patient contact, demographic, and emergency information."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                aria-label="Close patient form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="patient-name" className="text-sm font-medium text-foreground">
                    Full name
                  </label>
                  <input
                    id="patient-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleFormChange}
                    autoComplete="name"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Jane Doe"
                    disabled={submittingForm}
                    required
                  />
                  {formErrors.name && <p className="mt-1 text-xs text-destructive">{formErrors.name}</p>}
                </div>

                <div>
                  <label htmlFor="patient-email" className="text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <input
                    id="patient-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    autoComplete="email"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="patient@example.com"
                    disabled={submittingForm}
                    required
                  />
                  {formErrors.email && <p className="mt-1 text-xs text-destructive">{formErrors.email}</p>}
                </div>

                <div>
                  <label htmlFor="patient-phone" className="text-sm font-medium text-foreground">
                    Phone number
                  </label>
                  <input
                    id="patient-phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFormChange}
                    autoComplete="tel"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="+1 555 123 4567"
                    disabled={submittingForm}
                  />
                </div>

                <div>
                  <label htmlFor="patient-dob" className="text-sm font-medium text-foreground">
                    Date of birth
                  </label>
                  <input
                    id="patient-dob"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={submittingForm}
                  />
                </div>

                <div>
                  <label htmlFor="patient-gender" className="text-sm font-medium text-foreground">
                    Gender
                  </label>
                  <select
                    id="patient-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={submittingForm}
                  >
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="patient-blood" className="text-sm font-medium text-foreground">
                    Blood type
                  </label>
                  <input
                    id="patient-blood"
                    name="bloodType"
                    type="text"
                    value={formData.bloodType}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. O+"
                    disabled={submittingForm}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="patient-address" className="text-sm font-medium text-foreground">
                  Address
                </label>
                <textarea
                  id="patient-address"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Street, City, State"
                  disabled={submittingForm}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="patient-emergency" className="text-sm font-medium text-foreground">
                    Emergency contact
                  </label>
                  <input
                    id="patient-emergency"
                    name="emergencyContact"
                    type="text"
                    value={formData.emergencyContact}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Name & phone"
                    disabled={submittingForm}
                  />
                </div>

                {isCreateMode && (
                  <div>
                    <label htmlFor="patient-password" className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Temporary password
                    </label>
                    <input
                      id="patient-password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      autoComplete="new-password"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Minimum 6 characters"
                      disabled={submittingForm}
                      required
                    />
                    {formErrors.password ? (
                      <p className="mt-1 text-xs text-destructive">{formErrors.password}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Share this password with the patient so they can log in.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-muted-foreground"
                  disabled={submittingForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                >
                  {submittingForm
                    ? "Saving..."
                    : isCreateMode
                      ? "Register patient"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

