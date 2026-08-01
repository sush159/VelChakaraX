import { FileText, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onUpload: (file: File) => void
}

export default function UploadModal({ open, onClose, onUpload }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  if (!open) return null

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile)
      setSelectedFile(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Upload document</p>
            <p className="text-sm text-slate-500">Add a PDF to the knowledge base.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-blue-600" />
          <p className="mt-3 text-sm font-medium text-slate-700">Drop your PDF here</p>
          <p className="mt-1 text-sm text-slate-500">Only PDF documents are supported.</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          {selectedFile ? <p className="mt-3 text-sm text-slate-600">Selected: {selectedFile.name}</p> : null}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  )
}
