"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"

export const useFetchData = (apiCall) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiCall()
      setData(response.data)
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "An error occurred"
      setError(errorMsg)
      toast.error(errorMsg)
      console.log("[v0] Data fetch error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, error, refetch: fetchData }
}
