import { useMemo, useState } from 'react'
import { Search, UploadCloud } from 'lucide-react'
import Topbar from '../components/Topbar'
import DocumentTable from '../components/DocumentTable'
import UploadModal from '../components/UploadModal'
import { adminDocuments } from '../utils/adminData'
import type { DocumentItem } from '../types/admin'

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>(adminDocuments)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesSearch = document.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'All' || document.category === category
      return matchesSearch && matchesCategory
    })
  }, [documents, search, category])

  const handleUpload = (file: File) => {
    const nextDocument: DocumentItem = {
      id: Date.now(),
      name: file.name,
      category: 'New',
      chunks: 0,
      uploadedBy: 'Admin',
      uploadedAt: new Date().toISOString().slice(0, 10),
      status: 'Processing',
    }

    setDocuments((current) => [nextDocument, ...current])
  }

  return (
    <div className="flex h-full flex-col">
      <Topbar title="Documents" subtitle="Knowledge base management" />
      <div className="flex-1 space-y-5 bg-slate-50 p-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:min-w-[280px]">
              <Search className="h-4 w-4" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full border-0 bg-transparent outline-none" placeholder="Search documents" />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <option value="All">All Categories</option>
              <option value="Regulation">Regulation</option>
              <option value="Policy">Policy</option>
              <option value="Risk">Risk</option>
              <option value="New">New</option>
            </select>
          </div>
          <button onClick={() => setIsUploadOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
            <UploadCloud className="h-4 w-4" />
            Upload PDF
          </button>
        </div>

        <DocumentTable documents={filteredDocuments} />
      </div>

      <UploadModal open={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUpload={handleUpload} />
    </div>
  )
}
