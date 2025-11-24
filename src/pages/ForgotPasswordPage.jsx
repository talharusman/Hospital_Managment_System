"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail } from "lucide-react"
import toast from "react-hot-toast"
import { DashboardCard } from "../components/DashboardCard"

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    // TODO: Replace with real password-reset endpoint once backend is ready.
    toast.success("Password reset link sent to your email!")
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#060d27] via-[#0f1e46] to-[#132553] p-6">
      <DashboardCard className="relative w-full max-w-lg border border-border/40 bg-card/85 backdrop-blur supports-backdrop-filter:bg-card/70">
        <h1 className="text-2xl font-semibold text-center text-foreground">Forgot password</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Enter the email associated with your account and we will send instructions to reset your password. If you do not
          receive an email, please contact support.
        </p>

        {submitted ? (
          <div className="mt-8 space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Check your inbox</h2>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
              </p>
            </div>
            <Link to="/login" className="inline-flex items-center justify-center text-sm font-semibold text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-full border border-border/40 bg-background/90 py-2.5 pl-11 pr-4 text-sm text-foreground shadow-sm transition focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
            >
              Send reset link
            </button>

            <div className="text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </DashboardCard>
    </div>
  )
}

export default ForgotPasswordPage
