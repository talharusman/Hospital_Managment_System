"use client"

import { createContext, useState, useCallback, useEffect } from "react"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [role, setRole] = useState(localStorage.getItem("role"))

  useEffect(() => {
    // Check if token exists on mount
    const savedToken = localStorage.getItem("token")
    const savedRole = localStorage.getItem("role")
    const savedUser = localStorage.getItem("user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setRole(savedRole ? savedRole.toLowerCase() : null)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = useCallback((userData, authToken, userRole) => {
    const normalizedRole = userRole.toLowerCase()
    setUser(userData)
    setToken(authToken)
    setRole(normalizedRole)
    localStorage.setItem("token", authToken)
    localStorage.setItem("role", normalizedRole)
    localStorage.setItem("user", JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setRole(null)
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("user")
  }, [])

  const value = {
    user,
    token,
    role,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
