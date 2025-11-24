"use client"

import { useState, useEffect } from "react"
import { labAPI } from "../../services/api"
import toast from "react-hot-toast"
import { CheckCircle, Clock } from "lucide-react"

export const TestRequestsPage = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")
  const [selectedTest, setSelectedTest] = useState(null)

  useEffect(() => {
    fetchTests()
  }, [filter])

  const fetchTests = async () => {
    try {
      const response = await labAPI.getTests({ status: filter })
      setTests(response.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load tests")
      console.log("[v0] Error fetching tests:", error)
      setTests([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (testId, newStatus) => {
    try {
      await labAPI.updateTestStatus(testId, newStatus)
      toast.success("Status updated")
      fetchTests()
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Test Requests</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {["pending", "in progress", "completed", "all"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize font-semibold ${
              filter === status
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tests List */}
        <div className="lg:col-span-2 space-y-4">
          {tests.map((test) => (
            <div
              key={test.id}
              onClick={() => setSelectedTest(test)}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer transition ${
                selectedTest?.id === test.id ? "ring-2 ring-blue-500" : "hover:shadow-lg"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{test.patientName}</h3>
                  <p className="text-sm text-gray-600">ID: {test.patientId}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    test.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : test.status === "In Progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {test.status}
                </span>
              </div>

              <div className="mb-3">
                <p className="font-semibold text-gray-800">{test.testName}</p>
                <p className="text-sm text-gray-600">{test.details}</p>
              </div>

              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-500">Date: {test.date}</p>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    test.priority === "High" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {test.priority}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Test Details */}
        {selectedTest && (
          <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Details</h2>

            <div className="space-y-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500">Patient Name</p>
                <p className="text-gray-800 font-semibold">{selectedTest.patientName}</p>
              </div>
              <div>
                <p className="text-gray-500">Test Name</p>
                <p className="text-gray-800 font-semibold">{selectedTest.testName}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="text-gray-800 font-semibold">{selectedTest.date}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="text-gray-800 font-semibold">{selectedTest.status}</p>
              </div>
              <div>
                <p className="text-gray-500">Priority</p>
                <p className="text-gray-800 font-semibold">{selectedTest.priority}</p>
              </div>
              <div>
                <p className="text-gray-500">Details</p>
                <p className="text-gray-800">{selectedTest.details}</p>
              </div>
            </div>

            <div className="space-y-2">
              {selectedTest.status !== "In Progress" && (
                <button
                  onClick={() => handleStatusUpdate(selectedTest.id, "In Progress")}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  <Clock size={18} /> Start Test
                </button>
              )}
              {selectedTest.status !== "Completed" && (
                <button
                  onClick={() => handleStatusUpdate(selectedTest.id, "Completed")}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  <CheckCircle size={18} /> Mark Complete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default TestRequestsPage