import { Link, useLocation } from "react-router-dom"

export const AdminSidebar = ({ open }) => {
  const location = useLocation()

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Manage Users", path: "/admin/users" },
    { name: "Departments", path: "/admin/departments" },
  ]

  return (
    <aside className={`${open ? "w-64" : "w-20"} bg-gray-900 text-white transition-all duration-300`}>
      <nav className="mt-8 px-2 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-2 rounded-lg transition ${
              location.pathname === item.path ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            {open && item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
