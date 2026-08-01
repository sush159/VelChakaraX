import { useState } from 'react'
import Topbar from '../components/Topbar'

export default function AdminSettings() {
  const [embeddingModel, setEmbeddingModel] = useState('sentence-transformers/all-MiniLM-L6-v2')
  const [chunkSize, setChunkSize] = useState('512')
  const [chunkOverlap, setChunkOverlap] = useState('64')
  const [topK, setTopK] = useState('6')

  return (
    <div className="flex h-full flex-col">
      <Topbar title="Settings" subtitle="Manage retrieval and index configuration" />
      <div className="flex-1 bg-slate-50 p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Embedding Model</span>
                <select value={embeddingModel} onChange={(event) => setEmbeddingModel(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  <option value="sentence-transformers/all-MiniLM-L6-v2">MiniLM L6 v2</option>
                  <option value="text-embedding-3-large">text-embedding-3-large</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Chunk Size</span>
                <input value={chunkSize} onChange={(event) => setChunkSize(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Chunk Overlap</span>
                <input value={chunkOverlap} onChange={(event) => setChunkOverlap(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" />
              </label>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Top-K Retrieval</span>
                <input value={topK} onChange={(event) => setTopK(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" />
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Vector Database Status</p>
                <p className="mt-2 text-sm text-slate-600">Connected and ready for retrieval. 14.2K chunks indexed.</p>
              </div>
              <div className="flex gap-3">
                <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Rebuild Index</button>
                <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
