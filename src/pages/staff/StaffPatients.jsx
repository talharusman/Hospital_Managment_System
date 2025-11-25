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

export const StaffPatients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [recentOnly, setRecentOnly] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
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
    </div>
  )
}

