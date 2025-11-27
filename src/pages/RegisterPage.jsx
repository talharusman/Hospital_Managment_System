"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import { authAPI } from "../services/api"

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const sanitizedPhone = formData.phone.trim()
      const sanitizedAddress = formData.address.trim()
      await authAPI.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: sanitizedPhone || null,
        patientProfile: {
          date_of_birth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          address: sanitizedAddress || null,
          phone: sanitizedPhone || null,
        },
      })
      toast.success("Registration successful! Please log in.")
      navigate("/login")
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-secondary to-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-foreground">Create Patient Account</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Self-registration is available for patients only. Staff and providers should contact administration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold text-muted-foreground">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-muted-foreground">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-semibold text-muted-foreground">
              Phone Number (optional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1 555 123 4567"
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-muted-foreground">
                Date of Birth (optional)
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="gender" className="block text-sm font-semibold text-muted-foreground">
                Gender (optional)
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-semibold text-muted-foreground">
              Address (optional)
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              placeholder="Street, City, State"
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter a secure password"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-muted-foreground">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-2 text-base font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-(--action-disabled-bg) disabled:text-(--action-disabled-foreground)"
          >
            {loading ? "Creating Account..." : "Create Patient Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage