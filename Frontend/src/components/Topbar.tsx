import { Bell, Search, Settings2 } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          <input className="w-40 border-0 bg-transparent outline-none" placeholder="Search" />
        </label>
        <button className="rounded-xl border border-slate-200 p-2 text-slate-600">
          <Bell className="h-4 w-4" />
        </button>
        <button className="rounded-xl border border-slate-200 p-2 text-slate-600">
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
