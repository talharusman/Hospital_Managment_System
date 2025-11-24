"use client"

import { useState, useEffect } from "react"
import { labAPI } from "../../services/api"
import { Download, Eye } from "lucide-react"

export const CompletedReportsPage = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await labAPI.getTests({ status: "Completed" })
      setReports(response.data)
    } catch (error) {
      // Mock data
      setReports([
        {
          id: 1,
          patientName: "John Doe",
          testName: "Blood Count",
          date: "2024-11-20",
          findings: "All values within normal range",
          uploadedDate: "2024-11-21",
        },
        {
          id: 2,
          patientName: "Jane Smith",
          testName: "Glucose Test",
          date: "2024-11-19",
          findings: "Elevated fasting glucose",
          uploadedDate: "2024-11-20",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const filteredReports = reports.filter(
    (report) =>
      report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.testName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Completed Reports</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by patient name or test..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{report.patientName}</h3>
                <p className="text-gray-600 font-semibold">{report.testName}</p>
                <p className="text-sm text-gray-500 mt-2">Test Date: {report.date}</p>
                <p className="text-sm text-gray-500">Report Uploaded: {report.uploadedDate}</p>
                <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded">{report.findings}</p>
              </div>

              <div className="flex gap-2 ml-4">
                <button className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg">
                  <Eye size={20} />
                </button>
                <button className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg">
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">No completed reports found</p>
        </div>
      )}
    </div>
  )
}
export default CompletedReportsPage