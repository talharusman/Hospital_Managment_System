"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { authAPI } from "../services/api"
import toast from "react-hot-toast"
import { Mail, Lock, User, Phone, Shield, UserPlus, HeartPulse, ClipboardList, Stethoscope } from "lucide-react"

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "patient",
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const trimmedName = formData.name.trim()
    const trimmedEmail = formData.email.trim()
    const trimmedPassword = formData.password.trim()

    if (trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters long")
      return false
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address")
      return false
    }

    if (trimmedPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      await authAPI.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        role: formData.role,
      })
      toast.success("Registration successful! Please log in.")
      navigate("/login")
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const highlights = [
    {
      title: "Patient Care",
      description: "Book appointments, view prescriptions, and track your health records seamlessly.",
      icon: HeartPulse,
      accent: "text-rose-200 bg-rose-500/15",
    },
    {
      title: "Easy Access",
      description: "Access your medical history, lab reports, and invoices from anywhere.",
      icon: ClipboardList,
      accent: "text-sky-200 bg-sky-500/15",
    },
    {
      title: "Expert Doctors",
      description: "Connect with specialized healthcare professionals for quality care.",
      icon: Stethoscope,
      accent: "text-emerald-200 bg-emerald-500/15",
    },
  ]

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
              Join Our Platform
            </span>
            <h2 className="mt-6 text-4xl font-semibold leading-tight">
              Your health journey starts here.
            </h2>
            <p className="mt-4 text-sm text-white/80">
              Create your account and get instant access to comprehensive healthcare management services.
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

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/85">
            <p className="font-semibold text-white">Already have an account?</p>
            <p className="mt-1 text-xs text-white/75">
              Sign in to access your dashboard and continue managing your healthcare.
            </p>
            <Link
              to="/login"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/90 transition hover:bg-white/20"
            >
              Sign In →
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2.25rem] border border-border/40 bg-card/95 p-8 shadow-[0_30px_80px_rgba(6,13,39,0.45)] backdrop-blur supports-backdrop-filter:bg-card/80">
          <div className="pointer-events-none absolute -right-20 top-10 h-40 w-40 rounded-full bg-primary/15 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" aria-hidden="true" />

          <div className="relative mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserPlus className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
            <p className="mt-2 text-sm text-muted-foreground">Join our healthcare platform</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="relative space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  autoComplete="off"
                  className="w-full rounded-full border border-border/50 bg-background/95 py-3 pl-12 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  autoComplete="off"
                  className="w-full rounded-full border border-border/50 bg-background/95 py-3 pl-12 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  autoComplete="off"
                  className="w-full rounded-full border border-border/50 bg-background/95 py-3 pl-12 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Account Type</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-full border border-border/50 bg-background/95 py-3 pl-12 pr-10 text-sm text-foreground shadow-sm transition focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-full border border-border/50 bg-background/95 py-3 pl-12 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-full border border-border/50 bg-background/95 py-3 pl-12 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="relative mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage