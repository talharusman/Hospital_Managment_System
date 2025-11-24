"use client"

import { useState } from "react"
import { doctorAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Clock, Save } from "lucide-react"

export const AvailabilityPage = () => {
  const [availability, setAvailability] = useState([
    { day: "Monday", startTime: "09:00", endTime: "17:00", isAvailable: true },
    { day: "Tuesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
    { day: "Wednesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
    { day: "Thursday", startTime: "09:00", endTime: "17:00", isAvailable: true },
    { day: "Friday", startTime: "09:00", endTime: "17:00", isAvailable: true },
    { day: "Saturday", startTime: "10:00", endTime: "14:00", isAvailable: true },
    { day: "Sunday", startTime: "00:00", endTime: "00:00", isAvailable: false },
  ])

  const handleAvailabilityChange = (index, field, value) => {
    const newAvailability = [...availability]
    newAvailability[index][field] = value
    setAvailability(newAvailability)
  }

  const handleSave = async () => {
    try {
      await doctorAPI.updateAvailability(availability)
      toast.success("Availability updated successfully")
    } catch (error) {
      toast.error("Failed to update availability")
    }
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Availability</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {availability.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-24 font-semibold text-gray-700">{slot.day}</div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={slot.isAvailable}
                  onChange={(e) => handleAvailabilityChange(idx, "isAvailable", e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-600">Available</span>
              </label>

              {slot.isAvailable && (
                <>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleAvailabilityChange(idx, "startTime", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleAvailabilityChange(idx, "endTime", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="mt-8 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          <Save size={20} /> Save Availability
        </button>
      </div>
    </div>
  )
}
export default AvailabilityPage