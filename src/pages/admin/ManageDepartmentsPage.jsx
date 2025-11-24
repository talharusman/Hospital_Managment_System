"use client"

import { useState, useEffect } from "react"
import { adminAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Plus, Edit2, Trash2, X, Mail, Phone, UserRound, CalendarClock } from "lucide-react"

export const ManageDepartmentsPage = () => {
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    headId: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      headId: "",
    })
  }

  const startEditing = (department) => {
    if (!department) return

    setEditingId(department.id)
    setFormData({
      name: department.name || "",
      description: department.description || "",
      headId: department.headId ? String(department.headId) : "",
    })
    setShowForm(true)
  }

  const closeDetails = () => setSelectedDepartment(null)

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    resetForm()
  }

  const formatDate = (value) => {
    if (!value) return "—"
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    setLoading(true)

    try {
      const [departmentsResult, usersResult] = await Promise.allSettled([
        adminAPI.getDepartments(),
        adminAPI.getUsers(),
      ])

      if (departmentsResult.status === "fulfilled") {
        const list = Array.isArray(departmentsResult.value.data) ? departmentsResult.value.data : []
        setDepartments(list)
        setSelectedDepartment((current) => {
          if (!current) return current
          const updated = list.find((department) => department.id === current.id)
          return updated || null
        })
      } else {
        const error = departmentsResult.reason
        toast.error(error?.response?.data?.message || "Failed to load departments")
        console.log("[v0] Error fetching departments:", error)
        setDepartments([])
        setSelectedDepartment(null)
      }

      if (usersResult.status === "fulfilled") {
        const payload = Array.isArray(usersResult.value.data) ? usersResult.value.data : []
        setDoctors(payload.filter((user) => user.role === "doctor"))
      } else {
        const error = usersResult.reason
        toast.error("Failed to load department heads")
        console.log("[v0] Error fetching department heads:", error)
        setDoctors([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      headId: formData.headId ? Number(formData.headId) : null,
    }

    try {
      if (editingId) {
        await adminAPI.updateDepartment(editingId, payload)
        toast.success("Department updated")
      } else {
        await adminAPI.createDepartment(payload)
        toast.success("Department created")
      }
      closeForm()
      fetchDepartments()
    } catch (error) {
      toast.error("Operation failed")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await adminAPI.deleteDepartment(id)
        setDepartments(departments.filter((d) => d.id !== id))
        setSelectedDepartment(null)
        toast.success("Department deleted")
      } catch (error) {
        toast.error("Failed to delete")
      }
    }
  }

  const filteredDepartments = departments.filter((department) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.trim().toLowerCase()
    return [department.name, department.headName, department.description]
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(query))
  })

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Manage Departments</h1>
        <button
          onClick={() => {
            setEditingId(null)
            resetForm()
            setShowForm(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow transition"
          style={{ backgroundColor: "var(--admin-action-bg)", color: "var(--admin-action-fg)", boxShadow: "0 0 0 1px var(--button-border) inset" }}
          onMouseEnter={(event) => {
            if (document.documentElement.classList.contains("dark")) {
              event.currentTarget.style.backgroundColor = "var(--button-hover)"
              event.currentTarget.style.color = "var(--button-text-muted)"
            }
          }}
          onMouseLeave={(event) => {
            if (document.documentElement.classList.contains("dark")) {
              event.currentTarget.style.backgroundColor = "var(--admin-action-bg)"
              event.currentTarget.style.color = "var(--admin-action-fg)"
            }
          }}
        >
          <Plus size={20} /> Add Department
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by department name, head, or description"
          className="w-full max-w-md rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading && (
        <div className="mb-6 rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Loading departments...
        </div>
      )}

      {/* Departments Grid */}
      {filteredDepartments.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No departments match your search.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDepartments.map((dept) => (
          <div key={dept.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedDepartment(dept)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setSelectedDepartment(dept)
                }
              }}
              className="flex h-full cursor-pointer flex-col rounded-lg bg-card p-6 shadow transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              <span className="mb-2 text-lg font-semibold text-foreground">{dept.name}</span>
              <p className="mb-4 text-sm text-muted-foreground">{dept.description}</p>
              <p className="text-sm text-muted-foreground">Head: {dept.headName || dept.head || "Unassigned"}</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeForm}
        >
          <div
            className="w-full max-w-xl rounded-lg bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {editingId ? "Edit Department" : "Add Department"}
                </h2>
                <p className="text-sm text-muted-foreground">Provide department details below.</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Close form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground" htmlFor="department-name">
                  Department name
                </label>
                <input
                  id="department-name"
                  type="text"
                  placeholder="Cardiology"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground" htmlFor="department-description">
                  Description
                </label>
                <textarea
                  id="department-description"
                  placeholder="Heart and vascular care"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground" htmlFor="department-head">
                  Department head
                </label>
                <select
                  id="department-head"
                  value={formData.headId}
                  onChange={(event) => setFormData({ ...formData, headId: event.target.value })}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">No department head</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                      {doctor.email ? ` (${doctor.email})` : ""}
                    </option>
                  ))}
                </select>
                {doctors.length === 0 && (
                  <p className="text-xs text-muted-foreground">Add doctor accounts to assign a department head later.</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition"
                  style={{
                    borderColor: "var(--button-border)",
                    color: "var(--button-text-muted)",
                  }}
                  onMouseEnter={(event) => {
                    if (document.documentElement.classList.contains("dark")) {
                      event.currentTarget.style.backgroundColor = "var(--button-hover)"
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (document.documentElement.classList.contains("dark")) {
                      event.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md px-4 py-2 text-sm font-semibold transition"
                  style={{
                    backgroundColor: "var(--admin-action-bg)",
                    color: "var(--admin-action-fg)",
                    boxShadow: "0 0 0 1px var(--button-border) inset",
                  }}
                  onMouseEnter={(event) => {
                    if (document.documentElement.classList.contains("dark")) {
                      event.currentTarget.style.backgroundColor = "var(--button-hover)"
                      event.currentTarget.style.color = "var(--button-text-muted)"
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (document.documentElement.classList.contains("dark")) {
                      event.currentTarget.style.backgroundColor = "var(--admin-action-bg)"
                      event.currentTarget.style.color = "var(--admin-action-fg)"
                    }
                  }}
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDepartment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeDetails}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedDepartment.name}</h2>
                <p className="text-sm text-muted-foreground">Department details</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Description</p>
                <p className="mt-1 text-foreground">
                  {selectedDepartment.description || "No description provided."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Department head</p>
                {selectedDepartment.headName || selectedDepartment.head ? (
                  <div className="mt-1 flex items-center gap-2 text-foreground">
                    <UserRound size={16} />
                    <span>{selectedDepartment.headName || selectedDepartment.head}</span>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <UserRound size={16} />
                    <span>Unassigned</span>
                  </div>
                )}
                {selectedDepartment.headEmail && (
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <Mail size={16} />
                    <span>{selectedDepartment.headEmail}</span>
                  </div>
                )}
                {selectedDepartment.headPhone && (
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <Phone size={16} />
                    <span>{selectedDepartment.headPhone}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Created</p>
                  <div className="mt-1 flex items-center gap-2 text-foreground">
                    <CalendarClock size={16} />
                    <span>{formatDate(selectedDepartment.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Updated</p>
                  <div className="mt-1 flex items-center gap-2 text-foreground">
                    <CalendarClock size={16} />
                    <span>{formatDate(selectedDepartment.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const department = selectedDepartment
                  closeDetails()
                  startEditing(department)
                }}
                className="flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-primary transition hover:bg-primary/10"
              >
                <Edit2 size={16} /> Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedDepartment.id)}
                className="flex items-center gap-2 rounded-md border border-destructive px-4 py-2 text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default ManageDepartmentsPage