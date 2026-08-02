import { LayoutDashboard, Network, FileText, Settings, LogOut, Search, Bell, SlidersHorizontal, X } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'

export default function AdminLayout() {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Knowledge Graph', path: '/admin/knowledge-graph', icon: Network },
    { name: 'Documents', path: '/admin/documents', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ]

  // Get current page title for the header
  const getCurrentPageTitle = () => {
    if (location.pathname.includes('/dashboard')) return { title: 'Admin Dashboard', subtitle: 'Enterprise knowledge and compliance insights' }
    if (location.pathname.includes('/documents')) return { title: 'Documents', subtitle: 'Knowledge base management' }
    if (location.pathname.includes('/settings')) return { title: 'Settings', subtitle: 'Manage retrieval and index configuration' }
    if (location.pathname.includes('/knowledge-graph')) return { title: 'Knowledge Graph', subtitle: 'Explore relationships' }
    return { title: 'Admin Panel', subtitle: '' }
  }

  const { title, subtitle } = getCurrentPageTitle()
  const [bellOpen, setBellOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [headerSearch, setHeaderSearch] = useState('')

  const notifications = [
    { id: 1, text: 'EU AI Act annexes updated', time: '10 min ago' },
    { id: 2, text: 'Document re-indexed successfully', time: '1 hr ago' },
    { id: 3, text: 'Query volume spike detected', time: '3 hrs ago' },
  ]

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#112240] text-slate-300 flex flex-col transition-all">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white tracking-tight">PolicyMind</h1>
          <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 mt-6 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path)
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium hover:bg-slate-800 hover:text-white w-full"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={headerSearch}
                onChange={e => setHeaderSearch(e.target.value)}
                placeholder="Search"
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all w-64 placeholder:text-slate-400"
              />
            </div>

            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => { setBellOpen(p => !p); setFiltersOpen(false) }}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-900">Notifications</span>
                    <button onClick={() => setBellOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {notifications.map(n => (
                      <li key={n.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                        <p className="text-sm text-slate-700">{n.text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-2 border-t border-slate-100">
                    <button onClick={() => setBellOpen(false)} className="text-xs text-blue-600 hover:underline">Mark all as read</button>
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="relative">
              <button
                onClick={() => { setFiltersOpen(p => !p); setBellOpen(false) }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
              {filtersOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl z-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-900">View Filters</span>
                    <button onClick={() => setFiltersOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                  </div>
                  {['Show inactive docs', 'Compact view', 'Hide empty nodes'].map(label => (
                    <label key={label} className="flex items-center gap-2 py-1.5 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
