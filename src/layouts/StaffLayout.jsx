"use client"

import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  CalendarDays,
  Users2,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  ReceiptText,
  CircleDollarSign,
  FilePlus2,
  CreditCard,
} from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useDarkMode } from "../hooks/useDarkMode"
import toast from "react-hot-toast"

export const StaffLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useDarkMode(true)
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const userInitial = typeof user?.name === "string" && user.name.trim().length > 0 ? user.name.trim().charAt(0).toUpperCase() : ""

  const brandCardStyle = {
    background: "linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end))",
    borderColor: "var(--brand-pill-border)",
    color: "var(--brand-palette-fg)",
  }

  const brandBadgeStyle = {
    backgroundColor: "var(--brand-badge-bg)",
    color: "var(--brand-palette-fg)",
  }

  const sidebarToggleStyle = {
    backgroundColor: "var(--sidebar-accent)",
    color: "var(--brand-palette-fg)",
    borderColor: "var(--brand-pill-border)",
  }

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
    navigate("/login")
  }

  const menuItems = [
    { name: "Dashboard", path: "/staff/dashboard", icon: LayoutDashboard },
    { name: "Appointments", path: "/staff/appointments", icon: CalendarDays },
    { name: "Patient Management", path: "/staff/patients", icon: Users2 },
    { name: "Billing Dashboard", path: "/staff/billing/dashboard", icon: ReceiptText },
    { name: "Invoices", path: "/staff/billing/invoices", icon: CircleDollarSign },
    { name: "Create Invoice", path: "/staff/billing/create", icon: FilePlus2 },
    { name: "Payments", path: "/staff/billing/payments", icon: CreditCard },
  ]

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-background text-foreground">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "w-72" : "w-24"} relative flex h-full flex-col overflow-hidden border-r border-border bg-card transition-[width] duration-300`}
        >
          <div className="flex items-center justify-center px-6 pb-6 pt-7">
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-2 text-sm font-medium shadow-md transition ${
                sidebarOpen ? "w-full justify-start" : "h-14 w-14 justify-center"
              }`}
              style={brandCardStyle}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={brandBadgeStyle}>
                <Users2 className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <div className="leading-tight">
                  <p className="text-sm font-semibold tracking-wide">Perceptionist Portal</p>
                  <p className="text-xs opacity-80">Front Desk Operations</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 pb-24">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              const activeStyles = isActive
                ? { backgroundColor: "var(--admin-action-bg)", color: "var(--admin-action-fg)" }
                : undefined
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  style={activeStyles}
                  className={`group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    isActive
                      ? "shadow-lg"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  } ${sidebarOpen ? "gap-3" : "justify-center gap-0 px-3"}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${isActive ? "" : "text-muted-foreground"}`}
                    style={isActive ? { color: "var(--admin-action-fg)" } : undefined}
                  />
                  {sidebarOpen && <span className="truncate">{item.name}</span>}
                </button>
              )
            })}
          </nav>

          <div className="flex justify-center px-6 pb-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={sidebarToggleStyle}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <X size={18} strokeWidth={2.5} /> : <Menu size={18} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Navbar */}
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4" />

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
                <div className="hidden text-right leading-tight sm:flex sm:flex-col sm:items-end">
                  <p className="text-sm font-semibold text-foreground">{user?.name ?? "Perceptionist"}</p>
                  <p className="text-xs capitalize text-muted-foreground">{user?.role ?? "perceptionist"}</p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                  aria-hidden={!userInitial}
                >
                  {userInitial || <Users2 className="h-4 w-4" />}
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-destructive transition hover:bg-destructive/10"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto bg-muted/10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
