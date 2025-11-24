"use client"

import { useEffect, useMemo, useState } from "react"
import { doctorAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Clock, Save } from "lucide-react"

export const AvailabilityPage = () => {
  const defaultAvailability = useMemo(
    () => [
      { day: "Monday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "Tuesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "Wednesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "Thursday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "Friday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "Saturday", startTime: "10:00", endTime: "14:00", isAvailable: true },
      { day: "Sunday", startTime: "00:00", endTime: "00:00", isAvailable: false },
    ],
    [],
  )
  const cloneAvailability = (slots) =>
    slots.map((slot) => ({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: Boolean(slot.isAvailable),
    }))

  const [availability, setAvailability] = useState(() => cloneAvailability(defaultAvailability))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const response = await doctorAPI.getAvailability()
        const incoming = response.data?.availability
        if (Array.isArray(incoming) && incoming.length > 0) {
          setAvailability(cloneAvailability(incoming))
        } else {
          setAvailability(cloneAvailability(defaultAvailability))
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load availability")
        setAvailability(cloneAvailability(defaultAvailability))
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [defaultAvailability])

  const handleAvailabilityChange = (index, field, value) => {
    const newAvailability = [...availability]
    newAvailability[index][field] = value
    setAvailability(newAvailability)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await doctorAPI.updateAvailability(availability)
      toast.success("Availability updated successfully")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update availability")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-8 text-3xl font-semibold text-foreground">Manage Availability</h1>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-border/70 border-t-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {availability.map((slot, idx) => (
              <div
                key={slot.day}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-background/60 p-4"
              >
                <div className="w-24 font-semibold text-foreground">{slot.day}</div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(slot.isAvailable)}
                    onChange={(e) => handleAvailabilityChange(idx, "isAvailable", e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm text-muted-foreground">Available</span>
                </label>

                {slot.isAvailable && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleAvailabilityChange(idx, "startTime", e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <span className="text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleAvailabilityChange(idx, "endTime", e.target.value)}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="mt-8 flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-(--action-disabled-bg) disabled:text-(--action-disabled-foreground)"
        >
          <Save size={20} /> {saving ? "Saving..." : "Save Availability"}
        </button>
      </div>
    </div>
  )
}
export default AvailabilityPage