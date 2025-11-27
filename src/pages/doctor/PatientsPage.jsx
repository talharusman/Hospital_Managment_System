"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  Activity,
  CalendarClock,
  CalendarX,
  Mail,
  Phone,
  Pill,
  Search,
  UserRound,
  X,
} from "lucide-react"

import { doctorAPI } from "../../services/api"

export const PatientsPage = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [history, setHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true)
      try {
        const response = await doctorAPI.getPatients()
        setPatients(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load patients")
        setPatients([])
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const filteredPatients = useMemo(() => {
    if (!query.trim()) return patients
    const term = query.trim().toLowerCase()
    return patients.filter((patient) =>
      [patient.name, patient.email, patient.phone]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term))
    )
  }, [patients, query])

  const fetchPatientHistory = async (patientId) => {
    setHistory(null)
    setHistoryLoading(true)
    try {
      const response = await doctorAPI.getPatientHistory(patientId)
      setHistory(response.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load patient history")
      setHistory(null)
    } finally {
      setHistoryLoading(false)
    }
  }

  const openPatient = (patient) => {
    setSelectedPatient(patient)
    fetchPatientHistory(patient.id)
  }

  const closeDetails = () => {
    setSelectedPatient(null)
    setHistory(null)
  }

  const appointmentStatusBadge = (status) => {
    const value = status?.toLowerCase()
    if (value === "completed") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    if (value === "cancelled") return "bg-destructive/15 text-destructive"
    return "bg-primary/15 text-primary"
  }

  const prescriptionStatusBadge = (status) => {
    const value = status?.toLowerCase()
    if (value === "completed") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    if (value === "cancelled") return "bg-destructive/15 text-destructive"
    if (value === "expired") return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
    return "bg-primary/15 text-primary"
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground">
            Review assigned patients, contact details, and visit history in one place.
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2 md:w-80">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or phone"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border/70 border-t-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPatients.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 p-10 text-center">
              <CalendarX className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">No patients found</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Try adjusting your search or check back later for newly assigned patients.
              </p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => openPatient(patient)}
                className="flex flex-col items-start gap-4 rounded-xl border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{patient.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Patient #{patient.id}</p>
                  </div>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    {patient.completedAppointments ?? 0} visits
                  </span>
                </div>
                <div className="w-full space-y-2 text-sm text-muted-foreground">
                  {patient.email && (
                    <span className="flex items-center gap-2">
                      <Mail size={16} /> {patient.email}
                    </span>
                  )}
                  {patient.phone && (
                    <span className="flex items-center gap-2">
                      <Phone size={16} /> {patient.phone}
                    </span>
                  )}
                  {patient.lastAppointment && (
                    <span className="flex items-center gap-2">
                      <CalendarClock size={16} /> Last visit: {patient.lastAppointment}
                    </span>
                  )}
                  {patient.upcomingAppointments > 0 && (
                    <span className="flex items-center gap-2">
                      <Activity size={16} /> Upcoming: {patient.upcomingAppointments}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {selectedPatient && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
          onClick={closeDetails}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{selectedPatient.name}</h2>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Patient #{selectedPatient.id}</p>
                </div>
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

            <div className="mt-6 grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
              <div className="rounded-xl border border-border/50 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Contact</p>
                <div className="mt-2 space-y-1 text-foreground">
                  {selectedPatient.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={16} /> {selectedPatient.email}
                    </p>
                  )}
                  {selectedPatient.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={16} /> {selectedPatient.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border/50 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Profile</p>
                <div className="mt-2 space-y-1 text-foreground">
                  {selectedPatient.dateOfBirth && <p>Date of birth: {selectedPatient.dateOfBirth}</p>}
                  {selectedPatient.gender && <p>Gender: {selectedPatient.gender}</p>}
                  {selectedPatient.bloodType && <p>Blood type: {selectedPatient.bloodType}</p>}
                  {selectedPatient.address && (
                    <p className="flex items-start gap-2">
                      <span>Address:</span>
                      <span>{selectedPatient.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
              <div className="rounded-xl border border-border/50 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Stats</p>
                <div className="mt-2 space-y-2 text-foreground">
                  <p>Completed visits: {selectedPatient.completedAppointments ?? 0}</p>
                  <p>Upcoming visits: {selectedPatient.upcomingAppointments ?? 0}</p>
                  {selectedPatient.lastAppointment && <p>Last visit: {selectedPatient.lastAppointment}</p>}
                </div>
              </div>
              <div className="rounded-xl border border-border/50 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Emergency contact</p>
                <div className="mt-2 space-y-1 text-foreground">
                  {selectedPatient.emergencyContact ? (
                    <p>{selectedPatient.emergencyContact}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No emergency contact on file.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Recent appointments</p>
                {historyLoading ? (
                  <div className="mt-4 flex h-20 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-border/70 border-t-primary" />
                  </div>
                ) : history?.appointments?.length ? (
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {history.appointments.map((appt) => (
                      <li key={appt.id} className="rounded-xl border border-border/40 bg-background/60 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-foreground">{appt.date} • {appt.time}</p>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${appointmentStatusBadge(appt.status)}`}>
                            {appt.status}
                          </span>
                        </div>
                        {appt.reason && <p className="mt-2 text-sm">Reason: {appt.reason}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">No appointments recorded yet.</p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">Prescriptions</p>
                {historyLoading ? (
                  <div className="mt-4 flex h-20 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-border/70 border-t-primary" />
                  </div>
                ) : history?.prescriptions?.length ? (
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {history.prescriptions.map((prescription) => (
                      <li key={prescription.id} className="rounded-xl border border-border/40 bg-background/60 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-foreground">{prescription.date}</p>
                          <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${prescriptionStatusBadge(prescription.status)}`}>
                            <Pill size={12} /> {prescription.status}
                          </span>
                        </div>
                        {prescription.notes && <p className="mt-2 text-sm">{prescription.notes}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">No prescriptions recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientsPage
