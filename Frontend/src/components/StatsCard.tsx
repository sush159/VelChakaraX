interface StatsCardProps {
  label: string
  value: string
  delta?: string
  accent?: string
}

export default function StatsCard({ label, value, delta, accent = 'blue' }: StatsCardProps) {
  const accentClasses: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
    green: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
    purple: 'from-violet-500/10 to-violet-500/5 text-violet-600',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-600',
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${accentClasses[accent]} p-4`}>
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {delta ? <span className="text-sm font-medium text-slate-600">{delta}</span> : null}
      </div>
    </div>
  )
}
