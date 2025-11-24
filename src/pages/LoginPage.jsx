"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { authAPI } from "../services/api"
import toast from "react-hot-toast"
import { Mail, Lock } from "lucide-react"

export const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const demoCredentials = [
    { email: "admin@hospital.com", password: "password123", role: "Admin" },
    { email: "doctor@hospital.com", password: "password123", role: "Doctor" },
    { email: "patient@hospital.com", password: "password123", role: "Patient" },
    { email: "lab@hospital.com", password: "password123", role: "Lab Technician" },
    { email: "pharmacy@hospital.com", password: "password123", role: "Pharmacist" },
    { email: "staff@hospital.com", password: "password123", role: "Staff" },
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
      toast.success("Logged in successfully!")

      const roleRouteMap = {
        admin: "/admin/dashboard",
        doctor: "/doctor/dashboard",
        patient: "/patient/dashboard",
        lab_tech: "/lab/dashboard",
        lab_technician: "/lab/dashboard",
        "lab technician": "/lab/dashboard",
        pharmacist: "/pharmacy/dashboard",
        staff: "/billing/dashboard",
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
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#060d27] via-[#0f1e46] to-[#132553] p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/40 bg-card/85 p-8 shadow-2xl backdrop-blur supports-backdrop-filter:bg-card/70">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Hospital System</h1>
          <p className="mt-2 text-sm text-muted-foreground">Management &amp; Care Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-full border border-border/50 bg-background/90 py-2.5 pl-11 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-full border border-border/50 bg-background/90 py-2.5 pl-11 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>

        <div className="rounded-3xl border border-border/40 bg-card/90 p-6 shadow">
          <h2 className="mb-3 text-xl font-semibold text-foreground">Demo credentials</h2>
          <p className="mb-4 text-sm text-muted-foreground">Click any credential to auto-fill the login form:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {demoCredentials.map((cred) => (
              <button
                key={cred.email}
                onClick={() => fillCredentials(cred)}
                className="text-left"
              >
                <div className="rounded-2xl border border-border/50 bg-background/90 p-3 text-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow">
                  <div className="font-semibold text-foreground">{cred.role}</div>
                  <div className="text-xs text-muted-foreground">{cred.email}</div>
                  <div className="text-xs text-muted-foreground/80">Pass: {cred.password}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
export default LoginPage