import { Eye, RefreshCcw, Trash2 } from 'lucide-react'
import type { DocumentItem } from '../types/admin'

interface DocumentTableProps {
  documents: DocumentItem[]
}

export default function DocumentTable({ documents }: DocumentTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">PDF Name</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Number of Chunks</th>
            <th className="px-4 py-3 font-semibold">Uploaded By</th>
            <th className="px-4 py-3 font-semibold">Upload Date</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-700">
          {documents.map((document) => (
            <tr key={document.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{document.name}</td>
              <td className="px-4 py-3">{document.category}</td>
              <td className="px-4 py-3">{document.chunks}</td>
              <td className="px-4 py-3">{document.uploadedBy}</td>
              <td className="px-4 py-3">{document.uploadedAt}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {document.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                  <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><RefreshCcw className="h-4 w-4" /></button>
                  <button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
