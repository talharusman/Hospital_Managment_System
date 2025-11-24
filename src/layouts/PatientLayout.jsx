"use client"

import { useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { Menu, X, LogOut, Moon, Sun } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import toast from "react-hot-toast"

export const PatientLayout = () => {
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
    { name: "Dashboard", path: "/patient/dashboard", icon: "📊" },
    { name: "Book Appointment", path: "/patient/book-appointment", icon: "📅" },
    { name: "My Appointments", path: "/patient/appointments", icon: "📋" },
    { name: "Prescriptions", path: "/patient/prescriptions", icon: "💊" },
    { name: "Lab Reports", path: "/patient/lab-reports", icon: "🔬" },
    { name: "Invoices", path: "/patient/invoices", icon: "💳" },
  ]

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 overflow-hidden`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`font-bold text-blue-600 ${sidebarOpen ? "text-xl" : "text-center"}`}>
              {sidebarOpen ? "🏥 HMS" : "🏥"}
            </h2>
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navbar */}
          <div className="bg-white dark:bg-gray-800 shadow px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600"
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
export default PatientLayout