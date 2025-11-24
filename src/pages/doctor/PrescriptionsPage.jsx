"use client"

import { useState, useEffect } from "react"
import { doctorAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Plus, Save } from "lucide-react"

export const PrescriptionsPage = () => {
  const [showForm, setShowForm] = useState(false)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    patientId: "",
    medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
    notes: "",
  })

  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: "", dosage: "", frequency: "", duration: "" }],
    })
  }

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications]
    newMedications[index][field] = value
    setFormData({ ...formData, medications: newMedications })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await doctorAPI.createPrescription(formData)
      toast.success("Prescription created successfully")
      setShowForm(false)
      setFormData({ patientId: "", medications: [{ name: "", dosage: "", frequency: "", duration: "" }], notes: "" })
    } catch (error) {
      toast.error("Failed to create prescription")
    }
  }

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      const response = await doctorAPI.getAppointments()
      setPrescriptions(response.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load prescriptions")
      console.log("[v0] Error fetching doctor prescriptions:", error)
      setPrescriptions([])
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

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Prescriptions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} /> New Prescription
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Create Prescription</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
              <input
                type="text"
                placeholder="Patient ID or Name"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
              <div className="space-y-4">
                {formData.medications.map((med, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Medication Name"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(idx, "name", e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g., 500mg)"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(idx, "dosage", e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(idx, "frequency", e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., 7 days)"
                      value={med.duration}
                      onChange={(e) => handleMedicationChange(idx, "duration", e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddMedication}
                className="mt-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                + Add Another Medication
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                placeholder="Additional notes or instructions"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              <Save size={20} /> Create Prescription
            </button>
          </form>
        </div>
      )}

      {/* Prescriptions List */}
      <div className="grid gap-6">
        {prescriptions.map((prescription) => (
          <div key={prescription.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{prescription.patientName}</h3>
                <p className="text-sm text-gray-500">{prescription.date}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Medication:</span> {prescription.medication}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Dosage:</span> {prescription.dosage}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default PrescriptionsPage