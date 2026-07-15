import { NavLink, useNavigate } from 'react-router-dom'
import { clearToken } from '../api/client'

export default function Sidebar() {
  const navigate = useNavigate()

  const links = [
    { to: '/forms', label: 'Forms' },
    { to: '/behavioural-factors', label: 'Behavioural Factors' },
    { to: '/users', label: 'Users' },
    { to: '/sessions', label: 'Sessions' },
  ]

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-2xl font-bold">BRET</h1>
        <p className="text-sm text-slate-400">Admin Portal</p>
      </div>

      <nav className="flex-1 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 mb-2 transition ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full rounded-md bg-red-600 py-2 text-sm font-medium hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}