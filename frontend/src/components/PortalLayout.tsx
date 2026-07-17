import { NavLink, useNavigate } from 'react-router-dom'
import { clearToken } from '../api/client'

interface PortalLayoutProps {
  title: string
  children: React.ReactNode
}

export default function PortalLayout({ title, children }: PortalLayoutProps) {
  const navigate = useNavigate()

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation bar */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">BRET</h1>
            <p className="text-xs text-slate-400">Candidate Portal</p>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/portal"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm transition ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              Forms
            </NavLink>
            <NavLink
              to="/portal/profile"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm transition ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              My Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="ml-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-700"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  )
}