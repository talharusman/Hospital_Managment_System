"use client"

import { useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { Menu, X, LogOut, Moon, Sun } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import toast from "react-hot-toast"

export const StaffLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
    navigate("/login")
  }

  const menuItems = [
    { name: "Dashboard", path: "/staff/dashboard", icon: "📊" },
    { name: "Appointments", path: "/staff/appointments", icon: "📅" },
    { name: "Patient Management", path: "/staff/patients", icon: "👥" },
    { name: "Reports", path: "/staff/reports", icon: "📋" },
  ]

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-background text-foreground">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-sidebar text-sidebar-foreground shadow-lg transition-all duration-300 overflow-hidden flex flex-col border-r border-sidebar-border`}
        >
          <div className="p-4 border-b border-sidebar-border">
            <h2 className={`font-bold text-sidebar-primary text-center ${sidebarOpen ? "text-xl" : ""}`}>
              {sidebarOpen ? "🏥 HMS" : "🏥"}
            </h2>
          </div>

          <nav className="p-4 space-y-2 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-sidebar-accent/20 transition text-sidebar-foreground"
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navbar */}
          <div className="bg-card text-foreground shadow-md px-6 py-4 flex items-center justify-between border-b border-border">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg transition">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center gap-4">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-muted rounded-lg transition">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="flex items-center gap-3 border-l border-border pl-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
