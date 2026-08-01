import { Handle, Position } from '@xyflow/react'
import { BrainCircuit } from 'lucide-react'
import type { GraphNodeData } from '../types/admin'

interface GraphNodeProps {
  data: GraphNodeData
}

export default function GraphNode({ data }: GraphNodeProps) {
  const iconMap: Record<string, string> = {
    'use-case': 'bg-violet-500',
    regulation: 'bg-blue-500',
    risk: 'bg-rose-500',
    principle: 'bg-emerald-500',
    rights: 'bg-teal-500',
    requirement: 'bg-amber-500',
    example: 'bg-slate-600',
  }

  return (
    <div className="min-w-[180px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-slate-300" />
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-2 text-white ${iconMap[data.type]}`}>
          <BrainCircuit className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{data.label}</p>
          <p className="text-xs text-slate-500">{data.category}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300" />
    </div>
  )
}
