import { useEffect, useState } from "react"

export const DARK_MODE_STORAGE_KEY = "hms-dark-mode"

export const useDarkMode = (defaultValue = true) => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return defaultValue
    }
    const storedValue = window.localStorage.getItem(DARK_MODE_STORAGE_KEY)
    if (storedValue === null) {
      return defaultValue
    }
    return storedValue === "true"
  })

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(DARK_MODE_STORAGE_KEY, darkMode ? "true" : "false")

    const root = document.documentElement
    const body = document.body
    if (root) {
      root.classList.toggle("dark", darkMode)
    }
    if (body) {
      body.classList.toggle("dark", darkMode)
    }
  }, [darkMode])

  return [darkMode, setDarkMode]
}

export default useDarkMode
