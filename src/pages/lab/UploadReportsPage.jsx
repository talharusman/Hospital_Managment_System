"use client"

import { useState } from "react"
import { labAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Upload } from "lucide-react"

export const UploadReportsPage = () => {
  const [formData, setFormData] = useState({
    testId: "",
    findings: "",
    referenceRange: "",
    interpretation: "",
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tests, setTests] = useState([
    { id: 1, testName: "Blood Count", patientName: "John Doe", status: "Completed" },
    { id: 2, testName: "Glucose Test", patientName: "Jane Smith", status: "Completed" },
    { id: 3, testName: "Lipid Profile", patientName: "Bob Johnson", status: "Completed" },
  ])

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    setLoading(true)
    try {
      await labAPI.uploadReport(formData.testId, file)
      toast.success("Report uploaded successfully")
      setFormData({ testId: "", findings: "", referenceRange: "", interpretation: "" })
      setFile(null)
    } catch (error) {
      toast.error("Failed to upload report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Upload Lab Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Test Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Completed Test</label>
                <select
                  value={formData.testId}
                  onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Choose a test...</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.testName} - {test.patientName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Findings */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Findings</label>
                <textarea
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  placeholder="Enter test findings..."
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
                ></textarea>
              </div>

              {/* Reference Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Reference Range</label>
                <input
                  type="text"
                  value={formData.referenceRange}
                  onChange={(e) => setFormData({ ...formData, referenceRange: e.target.value })}
                  placeholder="e.g., 4.5-11.0 x10^9/L"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Interpretation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Interpretation</label>
                <textarea
                  value={formData.interpretation}
                  onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                  placeholder="Clinical interpretation of results..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"
                ></textarea>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Upload Report File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                    <p className="text-gray-700 font-semibold mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF, DOC, JPG, PNG (Max 10MB)</p>
                    {file && <p className="text-green-600 mt-3 font-semibold">{file.name}</p>}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.testId || !file}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Upload size={20} /> {loading ? "Uploading..." : "Upload Report"}
              </button>
            </form>
          </div>
        </div>

        {/* Upload Info */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 h-fit">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Upload Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-3">
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Include clear test results and values</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Specify reference ranges for comparison</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Add clinical interpretation notes</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Ensure document is clear and readable</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Maximum file size: 10MB</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
export default UploadReportsPage