import { Search, UploadCloud, Eye, RefreshCw, Trash2, ChevronDown, Loader2, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const categories = ['All Categories', 'Regulation', 'Policy', 'Risk', 'Guidance']
  const fileInputRef = useRef(null)

  const fetchDocuments = async () => {
    try {
      const res = await fetch('http://localhost:8000/documents')
      if (res.ok) {
        const data = await res.json()
        const mappedDocs = data.map(d => ({
          id: d.id,
          name: d.filename,
          category: 'Regulation',
          chunks: d.totalChunks,
          uploadedBy: 'System',
          uploadDate: new Date(d.ingestedAt).toISOString().split('T')[0],
          status: 'Indexed'
        }))
        setDocuments(mappedDocs)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 4000)
  }

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      showToast("Only PDF files are supported.")
      return
    }

    setIsUploading(true)
    showToast(`Uploading and indexing ${file.name}... this may take a few seconds.`)
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (res.ok) {
        const data = await res.json()
        showToast(data.message)
        fetchDocuments() // Refresh list
      } else {
        const err = await res.json()
        showToast(`Upload failed: ${err.detail}`)
      }
    } catch (_) {
      showToast("Error connecting to server")
    } finally {
      setIsUploading(false)
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleView = (name) => showToast(`Viewing ${name}`)
  const handleSync = (name) => showToast(`Syncing ${name}`)
  const handleDelete = (name) => showToast(`Deleted ${name} (simulated)`)

  const defaultDocuments = [
    { name: 'EU AI Act Overview.pdf', category: 'Regulation', chunks: 48, uploadedBy: 'Ava Chen', uploadDate: '2026-07-28', status: 'Indexed' },
    { name: 'DPDP Act Guidance.pdf', category: 'Policy', chunks: 36, uploadedBy: 'Noah Singh', uploadDate: '2026-07-25', status: 'Indexed' },
    { name: 'Hiring Risk Assessment.pdf', category: 'Risk', chunks: 22, uploadedBy: 'Liam Patel', uploadDate: '2026-07-22', status: 'Processing' },
  ]

  const displayDocs = (documents.length > 0 ? documents : defaultDocuments)
    .filter(doc => !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(doc => selectedCategory === 'All Categories' || doc.category === selectedCategory)

  return (
    <div className="max-w-6xl mx-auto relative">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-md shadow-lg text-sm transition-all animate-fade-in-down">
          {toast}
        </div>
      )}

      {/* Top Controls */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setCategoryOpen(p => !p)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              {selectedCategory}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {categoryOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setCategoryOpen(false) }}
                    className={['w-full text-left px-4 py-2.5 text-sm transition hover:bg-slate-50', cat === selectedCategory ? 'font-semibold text-blue-600' : 'text-slate-700'].join(' ')}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <input 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        <button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">PDF Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Number of Chunks</th>
                <th className="px-6 py-4">Uploaded By</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading documents...</td></tr>
              ) : (
                displayDocs.map((doc, i) => (
                  <tr key={doc.id || i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{doc.name}</td>
                    <td className="px-6 py-4">{doc.category}</td>
                    <td className="px-6 py-4">{doc.chunks}</td>
                    <td className="px-6 py-4">{doc.uploadedBy}</td>
                    <td className="px-6 py-4">{doc.uploadDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === 'Indexed' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3 text-slate-400">
                        <button onClick={() => handleView(doc.name)} className="hover:text-slate-700 transition-colors" aria-label="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleSync(doc.name)} className="hover:text-slate-700 transition-colors" aria-label="Sync">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(doc.name)} className="hover:text-red-600 transition-colors" aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
