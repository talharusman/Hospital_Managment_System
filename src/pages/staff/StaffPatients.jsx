"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  Users,
  UserPlus,
  User,
  Search,
  RefreshCw,
  CalendarDays,
  Mail,
  Phone,
  MapPin,
  Copy,
  Droplet,
  UserRound,
  X,
} from "lucide-react"
import { PageContainer } from "../../components/PageContainer"
import { DashboardCard } from "../../components/DashboardCard"
import { StatCard } from "../../components/StatCard"
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  useEffect(() => {
    if (!selectedPatientId) return
    const stillExists = patients.some((patient) => patient.id === selectedPatientId)
    if (!stillExists) {
      setIsDialogOpen(false)
      setSelectedPatientId(null)
    }
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

  const demographics = useMemo(() => {
    const total = patients.length
    const female = patients.filter((patient) => patient.gender?.toLowerCase() === "female").length
    const male = patients.filter((patient) => patient.gender?.toLowerCase() === "male").length
    const recent = patients.filter((patient) => {
      if (!patient.registeredAt) return false
      const registered = new Date(patient.registeredAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return registered >= weekAgo
    }).length

    return { total, female, male, recent }
  }, [patients])

  const statCards = [
    { title: "Total Patients", value: demographics.total, icon: Users, color: "blue" },
    { title: "Female", value: demographics.female, icon: UserPlus, color: "purple" },
    { title: "Male", value: demographics.male, icon: User, color: "teal" },
    { title: "New This Week", value: demographics.recent, icon: Users, color: "green" },
  ]

  const handleResetFilters = () => {
    setSearchTerm("")
    setGenderFilter("all")
    setRecentOnly(false)
  }

  const handleRefresh = async () => {
    await fetchPatients({ silent: true })
    toast.success("Patient list refreshed")
  }

  const openPatientDialog = (id) => {
    setSelectedPatientId(id)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setTimeout(() => setSelectedPatientId(null), 200)
  }

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

  return (
    <div style={themeFallbackVars}>
      <PageContainer
      title="Patient Management"
      description="Monitor arrivals, contact information, and demographic trends."
      contentClassName="space-y-6 bg-transparent border-none shadow-none p-0"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <DashboardCard className="bg-card/70 backdrop-blur-sm" title="Directory controls">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Search
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Name, email, phone, or address"
                  className="w-full rounded-xl border border-border/70 bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Gender
              <select
                value={genderFilter}
                onChange={(event) => setGenderFilter(event.target.value)}
                className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-sm">
              <input
                type="checkbox"
                checked={recentOnly}
                onChange={(event) => setRecentOnly(event.target.checked)}
                className="h-4 w-4 rounded border border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              New this week only
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 hover:border-primary/40"
            >
              Clear filters
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> {isRefreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {filteredPatients.length} of {patients.length} registered patients
        </p>
      </DashboardCard>

      <DashboardCard className="bg-card/70 backdrop-blur-sm" title="Patient directory">
        {filteredPatients.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 px-6 text-sm text-muted-foreground">
            No patients match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filteredPatients.map((patient) => {
              const recencyLabel = describeRecency(patient.registeredAt)

              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => openPatientDialog(patient.id)}
                  className="group flex h-full flex-col justify-between rounded-3xl border border-(--appointment-card-border) bg-(--appointment-card) px-5 py-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_18px_48px_rgba(11,19,42,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground">{patient.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{recencyLabel || "Registration date unknown"}</p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <span className="text-xs font-semibold text-primary/80 transition group-hover:text-primary">View profile →</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </DashboardCard>

      {isDialogOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={closeDialog}>
          <div
            className="relative w-full max-w-3xl rounded-3xl border border-border/60 bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient record</p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">{selectedPatient.name}</h2>
                {selectedPatient.email && <p className="text-sm text-muted-foreground">{selectedPatient.email}</p>}
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
                <div className="space-y-3 text-sm text-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 font-semibold text-primary">
                    <UserRound className="h-4 w-4" /> {selectedPatient.name || "—"}
                  </span>
                  <div className="space-y-2 text-sm text-foreground/90">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 text-primary" /> {selectedPatient.email || "No email"}
                      </span>
                      {selectedPatient.email && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${selectedPatient.email}`}
                            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-primary hover:text-primary"
                          >
                            Email
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedPatient.email, "Email")}
                            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-primary hover:text-primary"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 text-primary" /> {selectedPatient.phone || "No phone"}
                      </span>
                      {selectedPatient.phone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${selectedPatient.phone}`}
                            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-primary hover:text-primary"
                          >
                            Call
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedPatient.phone, "Phone number")}
                            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-primary hover:text-primary"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedPatient.emergencyContact && (
                    <div className="mt-3 rounded-2xl border border-dashed border-border/60 bg-background/90 p-3 text-xs text-muted-foreground">
                      <p className="font-semibold uppercase tracking-wide text-foreground/80">Emergency contact</p>
                      <p className="mt-1 text-foreground/80">{selectedPatient.emergencyContact}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profile highlights</p>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 text-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" /> Date of birth: {formatDate(selectedPatient.dateOfBirth)}
                  </span>
                  <span className="inline-flex items-center gap-2 text-foreground">
                    <Users className="h-4 w-4 text-primary" /> Gender: {selectedPatient.gender || "—"}
                  </span>
                  <span className="inline-flex items-center gap-2 text-foreground">
                    <Droplet className="h-4 w-4 text-primary" /> Blood type: {selectedPatient.bloodType || "—"}
                  </span>
                  <span className="inline-flex items-start gap-2 text-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{selectedPatient.address || "No address on file"}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" /> Registered: {formatDate(selectedPatient.registeredAt)}
                  </span>
                  {describeRecency(selectedPatient.registeredAt) && (
                    <span className="inline-flex items-center gap-2 text-primary">
                      <User className="h-4 w-4" /> {describeRecency(selectedPatient.registeredAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </PageContainer>
    </div>
  )
}

export default StaffPatients
