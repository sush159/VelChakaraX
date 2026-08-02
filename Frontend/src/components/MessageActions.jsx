import { useState } from 'react';
import { Bookmark, Copy, ThumbsUp, ThumbsDown, FileText, Download, ExternalLink, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const sources = [
  { id: 1, title: 'OECD AI Principles', organization: 'OECD', size: '2.1 MB', type: 'PDF' },
  { id: 2, title: 'UNESCO Recommendation on the Ethics of AI', organization: 'UNESCO', size: '1.8 MB', type: 'PDF' },
  { id: 3, title: 'NIST AI Risk Management Framework', organization: 'NIST', size: '3.4 MB', type: 'PDF' },
  { id: 4, title: 'ISO/IEC 42001', organization: 'ISO', size: '2.6 MB', type: 'PDF' },
];

export default function MessageActions({ message, onBookmark }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [thumbsUp, setThumbsUp] = useState(false);
  const [thumbsDown, setThumbsDown] = useState(false);

  const handleBookmark = () => {
    if (onBookmark) onBookmark(message)
  }

  const handleCopy = () => {
    if (message?.text) {
      navigator.clipboard.writeText(message.text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const handleThumbsUp = () => {
    setThumbsUp(true)
    setThumbsDown(false)
  }

  const handleThumbsDown = () => {
    setThumbsDown(true)
    setThumbsUp(false)
  }

  const handleDownloadAll = () => {
    const content = sources.map(s => `${s.title} — ${s.organization} (${s.type}, ${s.size})`).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sources.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
          copied
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied!' : 'Copy'}
      </button>

      <button
        type="button"
        onClick={handleBookmark}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Bookmark className="h-3.5 w-3.5" />
        Bookmark
      </button>

      <button
        type="button"
        onClick={handleThumbsUp}
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
          thumbsUp
            ? 'border-blue-300 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        Good Response
      </button>

      <button
        type="button"
        onClick={handleThumbsDown}
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
          thumbsDown
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        Bad Response
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <FileText className="h-3.5 w-3.5" />
          Sources ({sources.length})
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 top-full z-20 mt-3 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Sources ({sources.length})</h4>
              </div>

              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{source.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{source.organization}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{source.type} • {source.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open('http://localhost:8000/documents', '_blank')}
                      className="rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleDownloadAll}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                <Download className="h-4 w-4" />
                Download All Sources
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
