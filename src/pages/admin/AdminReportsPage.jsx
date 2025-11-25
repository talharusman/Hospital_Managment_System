"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Activity, ClipboardList, FlaskConical, FileWarning } from "lucide-react"
import { PageContainer } from "../../components/PageContainer"
import { DashboardCard } from "../../components/DashboardCard"
import { StatCard } from "../../components/StatCard"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"
import { adminAPI } from "../../services/api"

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

const formatCurrency = (value) => {
  if (typeof value !== "number") return "—"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

const statusConfig = {
  scheduled: {
    label: "Scheduled",
    barBg: "var(--status-scheduled-bg, rgba(77, 141, 255, 0.18))",
    textColor: "var(--status-scheduled-fg, #1d3f91)",
  },
  completed: {
    label: "Completed",
    barBg: "var(--status-completed-bg, rgba(76, 195, 138, 0.18))",
    textColor: "var(--status-completed-fg, #1b5a3c)",
  },
  cancelled: {
    label: "Cancelled",
    barBg: "var(--status-cancelled-bg, rgba(197, 68, 68, 0.18))",
    textColor: "var(--status-cancelled-fg, #7d2f2f)",
  },
  noShow: {
    label: "No-show",
    barBg: "var(--status-pending-bg, rgba(255, 184, 77, 0.2))",
    textColor: "var(--status-pending-fg, #7a4a00)",
  },
}

const invoiceStatusTokens = {
  paid: {
    bg: "var(--status-paid-bg, rgba(76, 195, 138, 0.16))",
    fg: "var(--status-paid-fg, #1f5139)",
  },
  pending: {
    bg: "var(--status-pending-bg, rgba(255, 184, 77, 0.2))",
    fg: "var(--status-pending-fg, #7a4a00)",
  },
  overdue: {
    bg: "var(--status-cancelled-bg, rgba(197, 68, 68, 0.18))",
    fg: "var(--status-cancelled-fg, #7d2f2f)",
  },
}

export const AdminReportsPage = () => {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const themeFallbackVars = {
    "--appointment-card": "rgba(11, 19, 42, 0.04)",
    "--appointment-card-border": "rgba(11, 19, 42, 0.12)",
    "--status-paid-bg": "rgba(76, 195, 138, 0.16)",
    "--status-paid-fg": "#1f5139",
    "--status-pending-bg": "rgba(255, 184, 77, 0.2)",
    "--status-pending-fg": "#7a4a00",
    "--status-scheduled-bg": "rgba(77, 141, 255, 0.18)",
    "--status-scheduled-fg": "#1d3f91",
    "--status-completed-bg": "rgba(76, 195, 138, 0.18)",
    "--status-completed-fg": "#1b5a3c",
    "--status-cancelled-bg": "rgba(197, 68, 68, 0.18)",
    "--status-cancelled-fg": "#7d2f2f",
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await adminAPI.getReports()
      setReport(data)
    } catch (err) {
      const message = err.response?.data?.message || "Unable to load reports"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const appointmentStatusChart = useMemo(() => {
    if (!report?.appointmentStatus) return []
    const total = Object.values(report.appointmentStatus).reduce((acc, value) => acc + (Number(value) || 0), 0)
    return Object.entries(report.appointmentStatus).map(([status, count]) => {
      const normalized = status === "noShow" ? "noShow" : status
      const value = Number(count) || 0
      const percentage = total === 0 ? 0 : Math.round((value / total) * 100)
      return {
        status: normalized,
        count: value,
        percentage,
      }
    })
  }, [report])

  const statCards = useMemo(() => {
    const metrics = report?.metrics || {}
    return [
      { title: "Total Patients", value: metrics.totalPatients ?? 0, icon: ClipboardList, color: "blue" },
      { title: "Upcoming Appointments", value: metrics.upcomingAppointments ?? 0, icon: Activity, color: "teal" },
      { title: "Pending Invoices", value: metrics.pendingInvoices ?? 0, icon: FileWarning, color: "orange" },
      { title: "Active Lab Tests", value: metrics.activeLabTests ?? 0, icon: FlaskConical, color: "green" },
    ]
  }, [report])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={fetchReports} />

  const departmentLoad = Array.isArray(report?.departmentLoad) ? report.departmentLoad : []
  const recentPatients = Array.isArray(report?.recentPatients) ? report.recentPatients : []
  const outstandingInvoices = Array.isArray(report?.outstandingInvoices) ? report.outstandingInvoices : []

  return (
    <div style={themeFallbackVars}>
      <PageContainer
        title="Operational Reports"
        description="Review caseload, departmental capacity, and outstanding tasks across the hospital."
        contentClassName="space-y-6 bg-transparent border-none shadow-none p-0"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <DashboardCard title="Appointment distribution">
          <div className="space-y-4">
            {appointmentStatusChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointment records found.</p>
            ) : (
              appointmentStatusChart.map((entry) => {
                const labelKey = entry.status === "no-show" || entry.status === "noShow" ? "noShow" : entry.status
                const tokens = statusConfig[labelKey] || statusConfig.scheduled
                const label = tokens.label || labelKey

                return (
                  <div key={labelKey} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="font-medium text-foreground" style={{ color: tokens.textColor }}>
                        {label}
                      </span>
                      <span>{entry.count} · {entry.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/40">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${entry.percentage}%`, backgroundColor: tokens.barBg }}
                        role="presentation"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DashboardCard>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardCard title="Department staffing">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/40 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Active Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {departmentLoad.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                        No department records found.
                      </td>
                    </tr>
                  ) : (
                    departmentLoad.map((department) => (
                      <tr key={department.id} className="text-sm text-muted-foreground">
                        <td className="px-4 py-3 font-medium text-foreground">{department.department || "—"}</td>
                        <td className="px-4 py-3">{department.staffCount ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>

          <DashboardCard title="Recent patient registrations">
            <ul className="space-y-4">
              {recentPatients.length === 0 ? (
                <li className="text-sm text-muted-foreground">No recent registrations.</li>
              ) : (
                recentPatients.map((patient) => (
                  <li key={patient.id} className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{patient.name || "—"}</p>
                      <p>{patient.email || "—"}</p>
                    </div>
                    <span className="rounded-full bg-muted/40 px-3 py-1 text-xs text-muted-foreground/80">
                      {formatDate(patient.registeredAt)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </DashboardCard>
        </div>

        <DashboardCard title="Outstanding invoices">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/40 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {outstandingInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No outstanding invoices.
                    </td>
                  </tr>
                ) : (
                  outstandingInvoices.map((invoice) => (
                    <tr key={invoice.id} className="text-sm text-muted-foreground">
                      <td className="px-4 py-3 font-medium text-foreground">#{invoice.id}</td>
                      <td className="px-4 py-3">{invoice.patientName || "—"}</td>
                      <td className="px-4 py-3">{formatCurrency(invoice.amount)}</td>
                      <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const statusKey = String(invoice.status || "pending").toLowerCase()
                          const tokens = invoiceStatusTokens[statusKey] || invoiceStatusTokens.pending
                          const label = statusKey
                            .split("-")
                            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                            .join(" ")

                          return (
                            <span
                              className="inline-flex min-w-[88px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold"
                              style={{ backgroundColor: tokens.bg, color: tokens.fg }}
                            >
                              {label}
                            </span>
                          )
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </PageContainer>
    </div>
  )
}

export default AdminReportsPage
