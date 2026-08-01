import { Activity, FileText, Layers3, MessageSquareText, ShieldCheck } from 'lucide-react'
import Topbar from '../components/Topbar'
import StatsCard from '../components/StatsCard'

export default function AdminDashboard() {
  return (
    <div className="flex h-full flex-col">
      <Topbar title="Admin Dashboard" subtitle="Enterprise knowledge and compliance insights" />
      <div className="flex-1 space-y-6 overflow-auto bg-slate-50 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Knowledge Documents" value="184" delta="+12%" accent="blue" />
          <StatsCard label="Vector Chunks" value="14.2K" delta="+8%" accent="purple" />
          <StatsCard label="Indexed Regulations" value="32" delta="+3" accent="green" />
          <StatsCard label="Today's Queries" value="1,284" delta="+19%" accent="amber" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Analytics Graph</h3>
                <p className="text-sm text-slate-500">Trend of knowledge usage and compliance activity</p>
              </div>
              <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-6 flex h-64 items-end gap-3 rounded-2xl bg-slate-50 p-4">
              {[40, 65, 58, 82, 74, 92].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-2xl bg-gradient-to-t from-blue-600 to-sky-400" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Document Categories</h3>
            <div className="mt-5 space-y-3">
              {[
                ['Regulations', '42%'],
                ['Policies', '28%'],
                ['Risk', '18%'],
                ['Guidance', '12%'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <div className="mt-4 space-y-3">
              {[
                ['New regulation index', 'EU AI Act annexes updated', '10 mins ago'],
                ['Document re-indexed', 'Hiring Risk Assessment.pdf', '1 hr ago'],
                ['Query spike detected', 'Policy Q&A volume increased', '3 hrs ago'],
              ].map(([title, detail, time]) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="rounded-xl bg-blue-100 p-2 text-blue-600"><ShieldCheck className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="text-sm text-slate-500">{detail}</p>
                  </div>
                  <span className="text-xs text-slate-400">{time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Recent Queries</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {['Can I use AI to screen employees?', 'What are the consent rules?', 'How do I assess AI risks?'].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                    <MessageSquareText className="h-4 w-4 text-blue-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">System Health</h3>
              <div className="mt-4 space-y-3">
                {[
                  ['Embedding Index', 'Healthy'],
                  ['Vector Search', 'Healthy'],
                  ['Document Sync', 'Warning'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <span>{label}</span>
                    <span className={value === 'Warning' ? 'text-amber-600' : 'text-emerald-600'}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
