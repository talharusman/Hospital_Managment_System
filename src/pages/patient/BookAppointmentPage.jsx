"use client"

import { useEffect, useMemo, useState } from "react"
import { patientAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Calendar, Clock, FileText, Loader2, Stethoscope, Check, Building2, UserRound } from "lucide-react"
import { PageContainer } from "../../components/PageContainer"
import { DashboardCard } from "../../components/DashboardCard"

export const BookAppointmentPage = () => {
  const [formData, setFormData] = useState({
    doctorId: "",
    department: "",
    date: "",
    time: "",
    reason: "",
  })
  const [doctors, setDoctors] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingDoctors, setFetchingDoctors] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await patientAPI.getDoctors()
        setDoctors(response.data)
      } catch (error) {
        console.error("[patient] Failed to load doctors", error)
        toast.error(error.response?.data?.message || "Failed to load doctors")
      } finally {
        setFetchingDoctors(false)
      }
    }

    fetchDoctors()
  }, [])

  const { doctorId, date } = formData

  useEffect(() => {
    if (!doctorId || !date) {
      setAvailableSlots([])
      return
    }

    const fetchAvailability = async () => {
      setLoadingSlots(true)
      try {
        const response = await patientAPI.getDoctorAvailability(doctorId, date)
        const slots = response.data?.slots || []
        setAvailableSlots(slots)

        if (!slots.some((slot) => slot.value === formData.time)) {
          setFormData((previous) => ({ ...previous, time: "" }))
        }
      } catch (error) {
        console.error("[patient] Failed to load availability", error)
        toast.error(error.response?.data?.message || "Failed to load availability")
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchAvailability()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date])

  const departments = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(doctors.map((doctor) => doctor.department).filter(Boolean)))
    return uniqueDepartments
  }, [doctors])

  const filteredDoctors = useMemo(() => {
    if (!formData.department) return doctors
    return doctors.filter((doctor) => doctor.department === formData.department)
  }, [doctors, formData.department])

  const selectedDoctor = useMemo(() => {
    return doctors.find((doctor) => String(doctor.id) === String(formData.doctorId)) || null
  }, [doctors, formData.doctorId])

  const progressSteps = useMemo(() => {
    const departmentDone = Boolean(formData.department)
    const doctorDone = Boolean(formData.doctorId)
    const scheduleDone = Boolean(formData.date && formData.time)

    return [
      {
        title: "Choose department",
        description: "Filter specialists by medical focus.",
        status: departmentDone ? "done" : "current",
      },
      {
        title: "Match with doctor",
        description: "Review available experts and pick your provider.",
        status: departmentDone ? (doctorDone ? "done" : "current") : "pending",
      },
      {
        title: "Pick schedule",
        description: "Select a convenient date and time slot.",
        status: doctorDone ? (scheduleDone ? "done" : "current") : "pending",
      },
    ]
  }, [formData.department, formData.doctorId, formData.date, formData.time])

  const handleDepartmentChange = (event) => {
    const department = event.target.value
    setFormData((previous) => ({ ...previous, department, doctorId: "", time: "" }))
    setAvailableSlots([])
  }

  const handleDoctorChange = (event) => {
    const selectedDoctorId = event.target.value
    const matchedDoctor = doctors.find((doctor) => String(doctor.id) === String(selectedDoctorId))
    setFormData((previous) => ({
      ...previous,
      doctorId: selectedDoctorId,
      time: "",
      department: matchedDoctor?.department || previous.department,
    }))
  }

  const handleDateChange = (event) => {
    const selectedDate = event.target.value
    setFormData((previous) => ({ ...previous, date: selectedDate }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.time) {
      toast.error("Select a time slot")
      return
    }

    const trimmedReason = formData.reason.trim()
    if (trimmedReason.length < 3) {
      toast.error("Reason must be at least 3 characters long")
      return
    }

    setLoading(true)
    try {
      await patientAPI.bookAppointment({
        doctorId: Number(formData.doctorId),
        date: formData.date,
        time: formData.time,
        reason: trimmedReason,
      })
      toast.success("Appointment booked successfully")
      setSubmitted(true)

      setTimeout(() => {
        setSubmitted(false)
        setFormData({ doctorId: "", department: "", date: "", time: "", reason: "" })
        setAvailableSlots([])
      }, 2500)
    } catch (error) {
      console.error("[patient] Failed to book appointment", error)
      toast.error(error.response?.data?.message || "Failed to book appointment")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <DashboardCard className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            ✓
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Appointment booked</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your appointment has been scheduled. We&apos;ll send you a confirmation shortly.
          </p>
        </DashboardCard>
      </div>
    )
  }

  return (
    <PageContainer
      title="Book an appointment"
      description="Choose a specialist and schedule a visit that fits your availability."
      contentClassName="bg-transparent p-0 border-none shadow-none"
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {progressSteps.map((step, index) => {
            const badgeClass =
              step.status === "done"
                ? "bg-emerald-500 text-white"
                : step.status === "current"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"

            const cardAccent =
              step.status === "done"
                ? "border-emerald-400/70 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                : step.status === "current"
                  ? "border-primary/70 bg-primary/10 text-primary"
                  : "border-border/60 bg-muted/30 text-muted-foreground"

            return (
              <div
                key={step.title}
                className={`rounded-3xl border px-5 py-4 shadow-sm transition ${cardAccent}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                    Step {index + 1}
                  </span>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${badgeClass}`}>
                    {step.status === "done" ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                </div>
                <p className="mt-3 text-base font-semibold text-foreground/90 dark:text-foreground">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/80">{step.description}</p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <DashboardCard className="space-y-6 rounded-3xl border border-border/60 bg-card/80 backdrop-blur shadow-lg">
          {fetchingDoctors ? (
            <div className="flex min-h-60 items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="min-h-60 space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Stethoscope size={20} />
              </div>
              <p className="text-base font-semibold text-foreground">No doctors available</p>
              <p className="text-sm text-muted-foreground">Please contact the hospital to add providers.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Select department</label>
                <select
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  className="w-full rounded-2xl border border-border/60 bg-background/90 px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
                >
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Select doctor</label>
                <select
                  value={formData.doctorId}
                  onChange={handleDoctorChange}
                  required
                  disabled={filteredDoctors.length === 0}
                  className="w-full rounded-2xl border border-border/60 bg-background/90 px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted"
                >
                  <option value="">Choose a doctor…</option>
                  {filteredDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} · {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Calendar size={16} /> Select date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full rounded-2xl border border-border/60 bg-background/90 px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
                />
              </div>

              {formData.doctorId && formData.date && (
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock size={16} /> Select time slot
                  </label>
                  {loadingSlots ? (
                    <div className="flex min-h-24 items-center justify-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border/60 bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                      No slots available for the selected day. Please choose another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => setFormData((previous) => ({ ...previous, time: slot.value }))}
                          className={`rounded-2xl border-2 px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                            formData.time === slot.value
                              ? "border-primary bg-primary text-primary-foreground shadow"
                              : "border-border/60 bg-muted/40 text-foreground hover:border-primary/60 hover:bg-muted"
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText size={16} /> Reason for visit
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(event) => setFormData((previous) => ({ ...previous, reason: event.target.value }))}
                  placeholder="Describe your symptoms or reason for visit…"
                  required
                  className="min-h-32 w-full rounded-2xl border border-border/60 bg-background/90 px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-muted"
              >
                {loading ? "Booking…" : "Book appointment"}
              </button>
            </form>
          )}
        </DashboardCard>

          <div className="space-y-6">
            <DashboardCard className="rounded-3xl border border-border/50 bg-card/80 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground">Booking summary</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Department
                  </span>
                  <span className="font-medium text-foreground">{formData.department || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" /> Doctor
                  </span>
                  <span className="font-medium text-foreground">
                    {selectedDoctor?.name || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Date
                  </span>
                  <span className="font-medium text-foreground">{formData.date || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Time
                  </span>
                  <span className="font-medium text-foreground">
                    {formData.time
                      ? availableSlots.find((slot) => slot.value === formData.time)?.label || formData.time
                      : "—"}
                  </span>
                </div>
              </div>
            </DashboardCard>

            {selectedDoctor && (
              <DashboardCard className="rounded-3xl border border-border/50 bg-muted/40 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your doctor</p>
                    <p className="text-base font-semibold text-foreground">{selectedDoctor.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedDoctor.specialization}</p>
                    {selectedDoctor.department && (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="h-4 w-4" /> {selectedDoctor.department}
                      </p>
                    )}
                    {selectedDoctor.nextAvailable && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Next availability: {selectedDoctor.nextAvailable}
                      </p>
                    )}
                  </div>
                </div>
              </DashboardCard>
            )}

            <DashboardCard className="rounded-3xl border border-primary/30 bg-primary/10 text-sm text-primary">
              <h3 className="text-lg font-semibold text-primary">Visit checklist</h3>
              <ul className="mt-4 space-y-3 text-primary/90">
                {["Arrive 10 minutes early for check-in", "Carry a valid ID and insurance information", "Bring recent medical reports or lab results", "Update your medical history if anything changed"].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </DashboardCard>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
export default BookAppointmentPage