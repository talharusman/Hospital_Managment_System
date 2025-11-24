"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, X, Mail, Phone, Shield, CalendarClock, UserRound } from "lucide-react"
import toast from "react-hot-toast"

import { adminAPI } from "../../services/api"

const initialFormState = {
  name: "",
  email: "",
  role: "patient",
  phone: "",
  password: "",
}

export const ManageUsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState(initialFormState)

  const resetForm = () => {
    setFormData(initialFormState)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
    setEditingId(null)
    resetForm()
  }

  const closeDetails = () => setSelectedUser(null)

  const formatDate = (value) => {
    if (!value) return "—"
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getUsers()
      const payload = Array.isArray(response.data) ? response.data : []
      setUsers(payload)
      setSelectedUser((current) => {
        if (!current) return current
        const updated = payload.find((user) => user.id === current.id)
        return updated || null
      })
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users")
      setUsers([])
      setSelectedUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      phone: formData.phone.trim() || null,
    }

    if (!editingId && !formData.password.trim()) {
      toast.error("Password is required to create a user")
      return
    }

    if (formData.password.trim()) {
      payload.password = formData.password.trim()
    }

    try {
      setSaving(true)
      if (editingId) {
        await adminAPI.updateUser(editingId, payload)
        toast.success("User updated successfully")
      } else {
        await adminAPI.createUser(payload)
        toast.success("User created successfully")
      }
      closeForm()
      fetchUsers()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Operation failed")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id) => {
    try {
      const response = await adminAPI.getUserById(id)
      const data = response.data || {}
      setFormData({
        name: data.name || "",
        email: data.email || "",
        role: data.role || "patient",
        phone: data.phone || "",
        password: "",
      })
      setEditingId(id)
      setShowForm(true)
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load user")
    }
  }

  const handleDelete = async (id) => {
    if (typeof window !== "undefined" && !window.confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      await adminAPI.deleteUser(id)
      toast.success("User deleted successfully")
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete user")
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.trim().toLowerCase()
    return [user.name, user.email, user.role, user.phone]
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(query))
  })

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage users</h1>
          <p className="text-sm text-muted-foreground">Invite, edit, or remove users across the platform.</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingId(null)
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
          <Plus size={18} /> Add user
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name, email, role, or phone"
          className="w-full max-w-md rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading && (
        <div className="mb-6 rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Loading users...
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No users match your search.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <div key={user.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedUser(user)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setSelectedUser(user)
                }
              }}
              className="flex h-full cursor-pointer flex-col rounded-lg bg-card p-6 shadow transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              <span className="mb-2 text-lg font-semibold text-foreground">{user.name}</span>
              <div className="flex items-center gap-2 text-sm font-medium capitalize text-muted-foreground">
                <Shield size={14} className="text-muted-foreground" />
                <span>{user.role.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeForm}>
          <div
            className="w-full max-w-xl rounded-lg bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{editingId ? "Edit user" : "Add user"}</h2>
                <p className="text-sm text-muted-foreground">
                  {editingId ? "Update account details or reset a password." : "Create a new account and assign a role."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Close form"
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="user-name">
                    Full name
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    value={formData.name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                    required
                    className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="user-email">
                    Email
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                    required
                    className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="user-phone">
                    Phone (optional)
                  </label>
                  <input
                    id="user-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="user-role">
                    Role
                  </label>
                  <select
                    id="user-role"
                    value={formData.role}
                    onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm capitalize text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="lab_technician">Lab technician</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="user-password">
                  {editingId ? "New password (optional)" : "Password"}
                </label>
                <input
                  id="user-password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder={editingId ? "Leave blank to keep current password" : "Set an initial password"}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition"
                  style={{
                    borderColor: document.documentElement.classList.contains("dark")
                      ? "var(--button-border)"
                      : "",
                    color: document.documentElement.classList.contains("dark")
                      ? "var(--button-text-muted)"
                      : "",
                    backgroundColor: "transparent",
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
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-70"
                  style={{
                    backgroundColor: document.documentElement.classList.contains("dark")
                      ? "var(--admin-action-bg)"
                      : "",
                    color: document.documentElement.classList.contains("dark")
                      ? "var(--admin-action-fg)"
                      : "",
                    boxShadow: document.documentElement.classList.contains("dark")
                      ? "0 0 0 1px var(--button-border) inset"
                      : "",
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
                  disabled={saving}
                >
                  {saving ? (editingId ? "Saving..." : "Creating...") : editingId ? "Save changes" : "Create user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeDetails}>
          <div
            className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedUser.name}</h2>
                <p className="text-sm text-muted-foreground">User details</p>
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
                <p className="text-xs font-semibold uppercase text-muted-foreground">Role</p>
                <div className="mt-1 flex items-center gap-2 text-foreground">
                  <Shield size={16} />
                  <span className="capitalize">{selectedUser.role.replace("_", " ")}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Contact</p>
                <div className="mt-1 flex items-center gap-2 text-foreground">
                  <Mail size={16} />
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.phone ? (
                  <div className="mt-1 flex items-center gap-2 text-foreground">
                    <Phone size={16} />
                    <span>{selectedUser.phone}</span>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <Phone size={16} />
                    <span>No phone on file</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Created</p>
                  <div className="mt-1 flex items-center gap-2 text-foreground">
                    <CalendarClock size={16} />
                    <span>{formatDate(selectedUser.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Updated</p>
                  <div className="mt-1 flex items-center gap-2 text-foreground">
                    <CalendarClock size={16} />
                    <span>{formatDate(selectedUser.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  closeDetails()
                  handleEdit(selectedUser.id)
                }}
                className="flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-primary transition hover:bg-primary/10"
              >
                <UserRound size={16} /> Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedUser.id)}
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
export default ManageUsersPage