import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clearToken } from '../api/client'

export default function Sidebar() {
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const links = [
    { to: '/users', label: 'Users', icon: '👥' },
    { to: '/forms', label: 'Forms', icon: '📋' },
    { to: '/behavioural-factors', label: 'Behavioural Factors', icon: '🧠' },
    { to: '/sessions', label: 'Sessions', icon: '📊' },
  ]

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-50'} min-h-screen bg-slate-900 text-white flex flex-col transition-all duration-300`}>
      <div className="px-6 py-5 border-b border-slate-700">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white hover:bg-slate-800 p-2 rounded"
        >
          {isCollapsed ? 'AP →' : '← Admin Portal'}
        </button>
      </div>

      <nav className="flex-1 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 mb-2 transition ${
                isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
            title={isCollapsed ? link.label : ''}
          >
            <span className="mr-2">{link.icon}</span>
            {!isCollapsed && link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full rounded-md bg-red-600 py-2 text-sm font-medium hover:bg-red-700"
        >
          {isCollapsed ? '→' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}