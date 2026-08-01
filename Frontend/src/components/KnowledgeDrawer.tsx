import { X } from 'lucide-react'
import type { GraphNodeData } from '../types/admin'

interface KnowledgeDrawerProps {
  node: GraphNodeData | null
  onClose: () => void
}

export default function KnowledgeDrawer({ node, onClose }: KnowledgeDrawerProps) {
  if (!node) return null

  return (
    <div className="fixed inset-y-0 right-0 z-20 w-[360px] border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{node.label}</p>
          <p className="text-sm text-slate-500">{node.category}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4 p-5 text-sm text-slate-600">
        <div>
          <p className="font-semibold text-slate-900">Description</p>
          <p className="mt-1">{node.description}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Connected Documents</p>
          <ul className="mt-1 list-disc pl-5">
            {node.connectedDocuments.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Relevant PDF</p>
          <p className="mt-1">{node.relevantPdf}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Indexed Chunks</p>
          <p className="mt-1">{node.indexedChunks}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Related Concepts</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {node.relatedConcepts.map((item) => (
              <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
