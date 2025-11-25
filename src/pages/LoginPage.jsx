"use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { DARK_MODE_STORAGE_KEY } from "../hooks/useDarkMode"
import { authAPI } from "../services/api"
import toast from "react-hot-toast"
import { Mail, Lock, ShieldCheck, Sparkles, Activity } from "lucide-react"

export const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    setEmail("")
    setPassword("")
  }, [])

  const demoCredentials = [
    { email: "admin@hospital.com", password: "password123", role: "Admin" },
    { email: "dr.cardiology@hospital.com", password: "password123", role: "Doctor" },
    { email: "jane.doe@hospital.com", password: "password123", role: "Patient" },
    { email: "labtech@hospital.com", password: "password123", role: "Lab Technician" },
    { email: "pharma@hospital.com", password: "password123", role: "Pharmacist" },
    { email: "staff@hospital.com", password: "password123", role: "Staff" },
  ]

  const highlights = [
    {
      title: "Role-aware access",
      description: "Protect sensitive medical records with portal-specific permissions and audit trails.",
      icon: ShieldCheck,
      accent: "text-emerald-200 bg-emerald-500/15",
    },
    {
      title: "Unified operations",
      description: "Coordinate appointments, billing, pharmacy, and labs without switching systems.",
      icon: Activity,
      accent: "text-sky-200 bg-sky-500/15",
    },
    {
      title: "Smart automations",
      description: "Automated reminders and real-time dashboards keep staff focused on patient care.",
      icon: Sparkles,
      accent: "text-violet-200 bg-violet-500/15",
    },
  ]

  const statBlocks = [
    { label: "Departments connected", value: "12+" },
    { label: "Daily appointments", value: "180" },
    { label: "Stakeholder portals", value: "6" },
  ]

  const fillCredentials = (cred) => {
    setEmail(cred.email)
    setPassword(cred.password)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await authAPI.login(email, password)
      const { user, token, role: legacyRole } = response.data
      const resolvedRole = legacyRole || user?.role
      if (!resolvedRole) {
        throw new Error("Role information missing in login response")
      }
      const normalizedRole = resolvedRole.toLowerCase()
      login(user, token, normalizedRole)

      if (typeof window !== "undefined") {
        window.localStorage.setItem(DARK_MODE_STORAGE_KEY, "true")
        const root = document.documentElement
        const body = document.body
        if (root) root.classList.add("dark")
        if (body) body.classList.add("dark")
      }
      toast.success("Logged in successfully!")

      const roleRouteMap = {
        admin: "/admin/dashboard",
        doctor: "/doctor/dashboard",
        patient: "/patient/dashboard",
        lab_tech: "/lab/dashboard",
        lab_technician: "/lab/dashboard",
        "lab technician": "/lab/dashboard",
        pharmacist: "/pharmacy/dashboard",
        staff: "/staff/dashboard",
      }

      const destination = roleRouteMap[normalizedRole]
      navigate(destination || "/")
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#060d27] via-[#0f1e46] to-[#132553] p-6">
      <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden="true">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute bottom-16 -right-24 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl gap-12 lg:grid-cols-[1.2fr,1fr]">
        <div className="hidden flex-col justify-between rounded-[2.5rem] border border-white/15 bg-white/10 p-10 text-white shadow-[0_40px_120px_rgba(7,14,45,0.45)] backdrop-blur-xl supports-backdrop-filter:bg-white/12 lg:flex">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
              Hospital Platform
            </span>
            <h2 className="mt-6 text-4xl font-semibold leading-tight">
              Orchestrate every department from a single, secure login.
            </h2>
            <p className="mt-4 text-sm text-white/80">
              Automate workflows, surface real-time metrics, and empower staff with portal experiences tailored to their role.
            </p>
          </div>

          <ul className="mt-8 space-y-4">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <li
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/85"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 ${item.accent}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-white/75">{item.description}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statBlocks.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white/85 shadow-[0_12px_40px_rgba(7,14,45,0.32)]"
              >
                <div className="text-2xl font-semibold text-white">{stat.value}</div>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2.25rem] border border-border/40 bg-card/95 p-8 shadow-[0_30px_80px_rgba(6,13,39,0.45)] backdrop-blur supports-backdrop-filter:bg-card/80">
          <div className="pointer-events-none absolute -right-20 top-10 h-40 w-40 rounded-full bg-primary/15 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" aria-hidden="true" />

          <div className="relative mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">Hospital System</h1>
            <p className="mt-2 text-sm text-muted-foreground">Management &amp; Care Platform</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="relative space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  className="w-full rounded-full border border-border/50 bg-background/95 py-3 pl-12 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  data-lpignore="true"
                  className="w-full rounded-full border border-border/50 bg-background/95 py-3 pl-12 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div className="relative mt-6 text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>

          <div className="relative mt-8 space-y-4 rounded-3xl border border-border/40 bg-background/90 p-6 shadow-inner">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Quick access</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Demo credentials</h2>
              <p className="mt-2 text-sm text-muted-foreground">Click a tile to auto-fill the login form.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => fillCredentials(cred)}
                  className="group rounded-2xl border border-border/50 bg-card/95 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
                >
                  <div className="text-sm font-semibold text-foreground">{cred.role}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{cred.email}</div>
                  <div className="mt-2 text-xs text-muted-foreground/80">Pass: {cred.password}</div>
                  <span className="mt-3 inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-primary opacity-0 transition group-hover:opacity-100">
                    Use credential →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default LoginPage