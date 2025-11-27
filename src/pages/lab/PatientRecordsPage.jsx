"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, X, Mail, Phone, CalendarClock, UserRound, FlaskConical } from "lucide-react"
import toast from "react-hot-toast"

import { labAPI } from "../../services/api"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"

const normalizeStatus = (value) => value?.toString().toLowerCase().replace(/\s+/g, "-")

const safeDate = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatStatus = (status) => {
  if (!status) return "-"
  return status
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const statusTone = (status) => {
  const value = normalizeStatus(status)
  if (value === "completed") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
  if (value === "pending") return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
  if (value === "in-progress") return "bg-primary/15 text-primary"
  return "bg-muted text-muted-foreground"
}

const aggregatePatients = (tests = []) => {
  const map = new Map()

  tests.forEach((test) => {
    const patientId = test.patientId || test.patient_id
    if (!patientId) return

    const email = test.patientEmail || test.patient_email || null
    const phone = test.patientPhone || test.patient_phone || null

    const existing = map.get(patientId) || {
      id: patientId,
      name: test.patientName,
      email,
      phone,
      totalTests: 0,
      pendingTests: 0,
      completedTests: 0,
      lastTestDate: null,
      lastTimestamp: 0,
      tests: [],
    }

    if (!existing.email && email) existing.email = email
    if (!existing.phone && phone) existing.phone = phone

    const normalizedStatus = normalizeStatus(test.rawStatus || test.status)

    existing.tests.push({
      id: test.id,
      name: test.testName,
      status: test.status,
      date: test.date,
      reportDate: test.reportDate,
      doctorName: test.doctorName,
      reportFilePath: test.reportFilePath,
    })

    existing.totalTests += 1
    if (normalizedStatus === "completed") existing.completedTests += 1
    if (normalizedStatus === "pending" || normalizedStatus === "in-progress") existing.pendingTests += 1

    const candidate = safeDate(test.reportDate) || safeDate(test.date)
    if (candidate) {
      const timestamp = candidate.getTime()
      if (timestamp > (existing.lastTimestamp || 0)) {
        existing.lastTimestamp = timestamp
        existing.lastTestDate = (test.reportDate || test.date || "").toString()
      }
    }

    map.set(patientId, existing)
  })

  return Array.from(map.values())
    .sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0))
    .map(({ lastTimestamp, ...rest }) => rest)
}

export const PatientRecordsPage = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState(null)

  useEffect(() => {
    fetchPatientRecords()
  }, [])

  const fetchPatientRecords = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await labAPI.getTests()
      const data = Array.isArray(response.data) ? response.data : []
      const aggregated = aggregatePatients(data)
      setPatients(aggregated)
      setSelectedPatientId((current) => {
        if (!current) return null
        return aggregated.some((patient) => patient.id === current) ? current : null
      })
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load patient records"
      setError(message)
      toast.error(message)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return patients
    return patients.filter((patient) => patient.name?.toLowerCase().includes(term))
  }, [patients, search])

  useEffect(() => {
    if (selectedPatientId && !filteredPatients.some((patient) => patient.id === selectedPatientId)) {
      setSelectedPatientId(null)
    }
  }, [filteredPatients, selectedPatientId])

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  )

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchPatientRecords} />

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patient Records</h1>
          <p className="text-muted-foreground">Review the patients assigned to the lab and their recent activity.</p>
        </div>
        <button
          type="button"
          onClick={fetchPatientRecords}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search patients by name"
          className="w-full rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {filteredPatients.length === 0 && (
        <p className="mb-6 rounded-2xl border border-dashed border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
          No patients match your search.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient) => (
          <button
            key={patient.id}
            onClick={() => setSelectedPatientId(patient.id)}
            className={`group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${
              selectedPatientId === patient.id ? "ring-2 ring-primary/60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <UserRound size={18} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Patient ID {patient.id}</p>
                  </div>
                </div>

                {patient.email && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} className="text-muted-foreground/80" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.phone && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} className="text-muted-foreground/80" />
                    <span>{patient.phone}</span>
                  </div>
                )}
              </div>

              <span className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                {patient.totalTests} tests
              </span>
            </div>

            <div className="mt-6 grid gap-2 text-sm text-muted-foreground/90">
              <div className="flex gap-2 text-xs font-semibold">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-600 dark:text-emerald-400">
                  Completed {patient.completedTests}
                </span>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-600 dark:text-amber-400">
                  Pending {patient.pendingTests}
                </span>
              </div>
              <p className="flex items-center gap-2 text-sm">
                <CalendarClock size={14} className="text-muted-foreground/80" />
                <span>
                  Last activity: <span className="text-foreground font-semibold">{patient.lastTestDate || "-"}</span>
                </span>
              </p>
            </div>
          </button>
        ))}
      </div>

      {selectedPatientId && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelectedPatientId(null)}>
          <div
            className="w-full max-w-3xl rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <UserRound size={22} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{selectedPatient.name}</h2>
                    <p className="text-sm text-muted-foreground">Patient details and lab history</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground/90">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 uppercase tracking-wide">
                    ID {selectedPatient.id}
                  </span>
                  {selectedPatient.email && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm font-medium text-muted-foreground">
                      <Mail size={14} /> {selectedPatient.email}
                    </span>
                  )}
                  {selectedPatient.phone && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm font-medium text-muted-foreground">
                      <Phone size={14} /> {selectedPatient.phone}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPatientId(null)}
                className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted/40"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Total tests</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{selectedPatient.totalTests}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Pending</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-foreground">{selectedPatient.pendingTests}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusTone("pending")}`}>
                    Pending
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Completed</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-foreground">{selectedPatient.completedTests}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusTone("completed")}`}>
                    Completed
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/15 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FlaskConical size={18} /> Recent lab activity
              </div>
              {selectedPatient.tests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lab activity recorded for this patient.</p>
              ) : (
                <div className="space-y-4 text-sm">
                  {selectedPatient.tests
                    .slice()
                    .sort((a, b) => {
                      const dateA = safeDate(a.reportDate) || safeDate(a.date) || new Date(0)
                      const dateB = safeDate(b.reportDate) || safeDate(b.date) || new Date(0)
                      return dateB - dateA
                    })
                    .map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-border/60 bg-card/85 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-foreground font-semibold">{entry.name}</p>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Request #{entry.id}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusTone(entry.status)}`}>
                            {formatStatus(entry.status)}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground/90 md:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <CalendarClock size={14} className="text-muted-foreground/80" />
                            <span>
                              Ordered: <span className="text-foreground font-medium">{entry.date || "-"}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarClock size={14} className="text-muted-foreground/80" />
                            <span>
                              Completed: <span className="text-foreground font-medium">{entry.reportDate || "-"}</span>
                            </span>
                          </div>
                          {entry.doctorName && (
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground/70">Referred by</span>
                              <p className="text-foreground font-medium">{entry.doctorName}</p>
                            </div>
                          )}
                          {entry.reportFilePath && (
                            <div className="md:col-span-2 text-muted-foreground/80">
                              File reference: <span className="text-foreground">{entry.reportFilePath}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientRecordsPage
