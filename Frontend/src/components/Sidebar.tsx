import { FileText, LayoutDashboard, LogOut, Network, Settings } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

const adminMenu = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Knowledge Graph', path: '/admin/knowledge-graph', icon: Network },
  { label: 'Documents', path: '/admin/documents', icon: FileText },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    window.localStorage.removeItem('role')
    window.sessionStorage.removeItem('role')
    navigate('/login')
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-800 bg-slate-950/95 text-slate-100">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600/20 p-2 text-blue-300">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">PolicyMind</p>
            <p className="text-sm text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1">
          {adminMenu.map(({ label, path, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
