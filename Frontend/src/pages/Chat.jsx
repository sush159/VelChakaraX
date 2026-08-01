import {
  Bookmark,
  Clock3,
  Menu,
  Search,
  Bell,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  askQuestion,
  getBookmarks,
  createBookmark,
  toggleBookmarkItem as apiToggleBookmarkItem,
  getHistory,
  createHistoryEntry,
} from '../api/policypilot'
import ChatInput from '../components/ChatInput'
import MessageBubble from '../components/MessageBubble'
import RiskSimulationPanel from '../components/RiskSimulationPanel'
import Sidebar from '../components/Sidebar'

const BOOKMARK_KEY = 'policymind-bookmarks'
const HISTORY_KEY = 'policymind-history'

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'chat', label: 'AI Chat' },
  { id: 'bookmarks', label: 'Bookmarks' },
  { id: 'simulator', label: 'Risk Simulator' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

const starterMessages = [
  {
    id: 'm1',
    role: 'assistant',
    text: 'Welcome to PolicyMind. I can help with governance controls, regulatory checks, and policy interpretation.',
  },
]

const parseChatChecklist = (question, answer) => {
  const questionText = (question || 'Safe deployment review').trim()
  const cleanedAnswer = (answer || '').replace(/\r/g, '')

  // ── NEW: parse "## Applicable Regulations" section ──────────────────────
  // Extract everything between "## Applicable Regulations" and the next "##"
  const regulationsSection = cleanedAnswer.match(
    /##\s*Applicable Regulations\s*\n([\s\S]*?)(?=\n##\s|\n={3,}|$)/i,
  )

  if (regulationsSection) {
    const sectionText = regulationsSection[1]
    // Top-level bullets only: lines starting with "- " (not indented sub-bullets)
    const regulationItems = sectionText
      .split(/\n/)
      .filter((line) => /^- /.test(line))
      .map((line) => line.replace(/^- /, '').trim())
      .filter(Boolean)

    if (regulationItems.length > 0) {
      return regulationItems.slice(0, 8).map((item, index) => ({
        id: `chat-reg-${Date.now()}-${index + 1}`,
        order: index + 1,
        title: item,
        clause: 'Applicable regulation identified by PolicyMind compliance analysis',
        completed: false,
      }))
    }
  }

  // ── FALLBACK: legacy "Relevant Regulations:" prose pattern ──────────────
  const relevantMatch = cleanedAnswer.match(/Relevant Regulations:\s*([\s\S]*?)(?:\n\s*Recommendation:|$)/i)
  const sourceText = relevantMatch ? relevantMatch[1] : cleanedAnswer
  const regulationItems = sourceText
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter((line) => line && !/^(Answer:|Relevant Regulations:|Recommendation:)/i.test(line))

  if (regulationItems.length === 0) {
    return [
      {
        id: `chat-reg-${Date.now()}-1`,
        order: 1,
        title: `Confirm remaining requirements for ${questionText}`,
        clause: 'Remaining compliance requirement for safe deployment without violations',
        completed: false,
      },
    ]
  }

  return regulationItems.slice(0, 8).map((item, index) => ({
    id: `chat-reg-${Date.now()}-${index + 1}`,
    order: index + 1,
    title: item,
    clause: 'Remaining compliance requirement for safe deployment without violations',
    completed: false,
  }))
}

export default function Chat() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [messages, setMessages] = useState(starterMessages)
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [bookmarks, setBookmarks] = useState([])
  const [historyEntries, setHistoryEntries] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadBookmarks = async () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const remote = await getBookmarks()
      setBookmarks(remote.length > 0 ? remote : JSON.parse(window.localStorage.getItem(BOOKMARK_KEY) || '[]'))
      window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(remote.length > 0 ? remote : []))
    } catch {
      try {
        setBookmarks(JSON.parse(window.localStorage.getItem(BOOKMARK_KEY) || '[]'))
      } catch {
        setBookmarks([])
      }
    }
  }

  useEffect(() => {
    loadBookmarks()

    const handleBookmarksUpdate = (event) => {
      const nextBookmarks = event.detail || JSON.parse(window.localStorage.getItem(BOOKMARK_KEY) || '[]')
      setBookmarks(nextBookmarks)
    }

    window.addEventListener('policymind-bookmarks-updated', handleBookmarksUpdate)
    return () => window.removeEventListener('policymind-bookmarks-updated', handleBookmarksUpdate)
  }, [])

  useEffect(() => {
    if (activeSection === 'bookmarks') {
      loadBookmarks()
    }
  }, [activeSection])

  const loadHistory = async () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const remote = await getHistory()
      setHistoryEntries(remote.length > 0 ? remote : JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]'))
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(remote.length > 0 ? remote : []))
    } catch {
      try {
        setHistoryEntries(JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]'))
      } catch {
        setHistoryEntries([])
      }
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks))
    }
  }, [bookmarks])

  useEffect(() => {
    loadHistory()

    const handleHistoryUpdate = (event) => {
      const nextHistory = event.detail || JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]')
      setHistoryEntries(nextHistory)
    }

    window.addEventListener('policymind-history-updated', handleHistoryUpdate)
    return () => window.removeEventListener('policymind-history-updated', handleHistoryUpdate)
  }, [])

  const handleSend = async () => {
    const trimmedPrompt = prompt.trim()

    if (!trimmedPrompt || isLoading) {
      return
    }

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmedPrompt,
    }

    setMessages((current) => [...current, userMessage])
    setPrompt('')
    setIsLoading(true)

    try {
      const data = await askQuestion(trimmedPrompt)
      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        text: data.answer || 'I could not find this information in the uploaded documents.',
        prompt: trimmedPrompt,
      }

      setMessages((current) => [...current, assistantMessage])
    } catch (error) {
      const errorMessage = {
        id: `${Date.now()}-assistant-error`,
        role: 'assistant',
        text: 'I could not reach the backend service right now. Please make sure the backend server is running on http://localhost:8000.',
      }

      setMessages((current) => [...current, errorMessage])
      console.error('Chat request failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookmarkMessage = async (message) => {
    if (!message || message.role !== 'assistant' || typeof window === 'undefined') {
      return
    }

    const questionText = message.prompt || 'Safe deployment review'
    const regulations = parseChatChecklist(questionText, message.text)
    const bookmark = {
      id: `chat-${message.id}`,
      type: 'chat',
      title: `Safe deployment checklist: ${questionText.slice(0, 55)}${questionText.length > 55 ? '…' : ''}`,
      summary: `Remaining regulations to clear before a safe deployment without violations for: ${questionText}`,
      createdAt: new Date().toISOString(),
      question: questionText,
      chatMessages: messages.map((item) => ({ ...item })),
      regulations,
    }

    // Sync to PostgreSQL (best-effort; keep localStorage as fallback)
    try {
      const saved = await createBookmark({
        bookmark_type: 'chat',
        title: bookmark.title,
        summary: bookmark.summary,
        question: questionText,
        chat_messages: bookmark.chatMessages,
        regulations: regulations.map((item) => ({
          order: item.order,
          title: item.title,
          clause: item.clause,
          completed: item.completed,
        })),
      })
      bookmark.id = saved.id
      bookmark.createdAt = saved.createdAt
    } catch (error) {
      console.warn('Could not sync bookmark to backend:', error)
    }

    const existing = JSON.parse(window.localStorage.getItem(BOOKMARK_KEY) || '[]')
    const updated = [bookmark, ...existing.filter((item) => item.id !== bookmark.id)].slice(0, 25)
    window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated))
    setBookmarks(updated)
    window.dispatchEvent(new CustomEvent('policymind-bookmarks-updated', { detail: updated }))
  }

  const dashboardStats = [
    {
      label: 'Saved Bookmarks',
      value: String(bookmarks.length),
      note: 'Current checklist count',
    },
    {
      label: 'Completed Items',
      value: String(
        bookmarks.reduce((total, bookmark) => total + (bookmark.regulations || []).filter((item) => item.completed).length, 0),
      ),
      note: 'Across saved checklists',
    },
    {
      label: 'History Entries',
      value: String(historyEntries.length),
      note: 'Archived assessments',
    },
    {
      label: 'Checklist Completion',
      value: `${bookmarks.length ? Math.round(
        (bookmarks.reduce((total, bookmark) => total + (bookmark.regulations || []).filter((item) => item.completed).length, 0) /
          bookmarks.reduce((total, bookmark) => total + (bookmark.regulations || []).length, 0)) * 100,
      ) : 0}%`,
      note: 'Of saved items',
    },
  ]

  const persistHistoryEntry = async (bookmark) => {
    if (typeof window === 'undefined') {
      return
    }

    const nextHistory = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]')
    const entry = {
      id: `history-${bookmark.id}`,
      title: bookmark.title,
      summary: bookmark.summary,
      createdAt: bookmark.createdAt,
      completedAt: new Date().toISOString(),
      question: bookmark.question || 'Safe deployment review',
      messages: bookmark.chatMessages || [],
      regulations: bookmark.regulations || [],
      type: 'chat',
    }

    // Sync to PostgreSQL (best-effort)
    try {
      const saved = await createHistoryEntry({
        title: entry.title,
        summary: entry.summary,
        type: 'chat',
        question: entry.question,
        messages: entry.messages,
        regulations: entry.regulations,
      })
      entry.id = saved.id
      entry.createdAt = saved.createdAt
      entry.completedAt = saved.completedAt
    } catch (error) {
      console.warn('Could not sync history entry to backend:', error)
    }

    const exists = nextHistory.some((item) => item.id === entry.id)
    const updated = exists ? nextHistory : [entry, ...nextHistory].slice(0, 25)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    setHistoryEntries(updated)
    window.dispatchEvent(new CustomEvent('policymind-history-updated', { detail: updated }))
  }

  const handleLogout = () => {
    navigate('/')
  }

  // ── Header search ────────────────────────────────────────────
  const handleHeaderSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setPrompt(searchQuery.trim())
      setActiveSection('chat')
      setSearchQuery('')
    }
  }

  const renderDashboard = () => {
    const completedChecklistCount = bookmarks.reduce(
      (total, bookmark) => total + (bookmark.regulations || []).filter((item) => item.completed).length,
      0,
    )

    return (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back, PolicyMind Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Live compliance tracking from your saved checklist activity.</p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((item) => (
            <article
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-medium text-slate-500">{item.note}</p>
              <p className="mt-3 text-sm text-slate-500">{item.label}</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</h3>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-12 gap-4">
          <article className="col-span-12 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">Saved Checklist Summary</h4>
            </div>

            {bookmarks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No saved compliance checklists yet. Bookmark a chat response to begin tracking remaining requirements.
              </div>
            ) : (
              <div className="space-y-3">
                {bookmarks.slice(0, 4).map((bookmark) => {
                  const total = (bookmark.regulations || []).length
                  const complete = (bookmark.regulations || []).filter((item) => item.completed).length
                  const percent = total ? Math.round((complete / total) * 100) : 0

                  return (
                    <div key={bookmark.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">{bookmark.title}</p>
                        <span className="text-xs font-medium text-slate-500">{percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{complete} of {total} items completed</p>
                    </div>
                  )
                })}
              </div>
            )}
          </article>

          <article className="col-span-12 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4">
            <h4 className="mb-4 text-lg font-semibold text-slate-900">Recent Activity</h4>
            {historyEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No completed checklist history yet. Finish a checklist to archive it here.
              </div>
            ) : (
              <div className="space-y-3">
                {historyEntries.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                    <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(entry.completedAt || entry.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="grid grid-cols-12 gap-4">
          <article className="col-span-12 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-12">
            <h4 className="mb-4 text-lg font-semibold text-slate-900">Compliance Overview</h4>
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative h-36 w-36 rounded-full bg-[conic-gradient(#2563eb_0_100%)] p-3">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{completedChecklistCount}</p>
                    <p className="text-xs text-slate-500">Completed</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Saved checklists</span>
                  <span className="font-semibold text-slate-900">{bookmarks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Archived history</span>
                  <span className="font-semibold text-slate-900">{historyEntries.length}</span>
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate-500">Overall progress</p>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${bookmarks.length ? Math.min(100, Math.round((completedChecklistCount / bookmarks.reduce((total, bookmark) => total + (bookmark.regulations || []).length, 0)) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    )
  }

  const renderAssistant = () => {
    return (
      <div className="space-y-5 pb-28">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Welcome to PolicyMind</h2>
          <p className="mt-1 text-sm text-slate-500">Your AI-powered compliance and governance assistant.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              'What is the EU AI Act?',
              'What are prohibited AI systems?',
              'What are the four functions of NIST AI RMF?',
              'What are key penalties under DPDP Act?',
            ].map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => setPrompt(question)}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
              >
                {question}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onBookmark={handleBookmarkMessage} />
          ))}

          {isLoading && (
            <MessageBubble
              message={{
                id: 'loading-assistant',
                role: 'assistant',
                text: 'Thinking…',
              }}
            />
          )}
        </section>
      </div>
    )
  }



  const toggleBookmarkItem = async (bookmarkId, regulationId) => {
    setBookmarks((current) => {
      const nextBookmarks = current.map((bookmark) => {
        if (bookmark.id !== bookmarkId) {
          return bookmark
        }

        const nextBookmark = {
          ...bookmark,
          regulations: bookmark.regulations.map((regulation) =>
            regulation.id === regulationId ? { ...regulation, completed: !regulation.completed } : regulation,
          ),
        }

        const total = nextBookmark.regulations.length
        const completeCount = nextBookmark.regulations.filter((regulation) => regulation.completed).length

        if (total > 0 && completeCount === total) {
          persistHistoryEntry(nextBookmark)
        }

        return nextBookmark
      })

      return nextBookmarks
    })

    // Sync the toggle to PostgreSQL (best-effort; only for server-synced bookmarks)
    const isRemoteBookmark = /^(chat|sim)-\d+$/.test(bookmarkId)
    const isRemoteRegulation = /^reg-\d+$/.test(regulationId)

    if (isRemoteBookmark && isRemoteRegulation) {
      try {
        const updated = await apiToggleBookmarkItem(bookmarkId, regulationId)
        setBookmarks((current) => {
          const next = current.map((bookmark) => (bookmark.id === bookmarkId ? { ...bookmark, ...updated } : bookmark))
          window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next))
          return next
        })
      } catch (error) {
        console.warn('Could not sync checklist toggle to backend:', error)
      }
    }
  }

  const renderBookmarks = () => {
    if (!bookmarks || bookmarks.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Bookmark className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">No regulations bookmarked yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Save a risk assessment or a chat idea to build a checklist of the regulations that still need to be addressed.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <section>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Saved compliance checklist</h2>
          <p className="mt-1 text-sm text-slate-500">Every bookmarked project keeps its violating regulations in order so your team can work through them systematically.</p>
        </section>

        <section className="space-y-4">
          {bookmarks.map((bookmark) => {
            const completedCount = bookmark.regulations.filter((item) => item.completed).length
            const progressPercent = bookmark.regulations.length
              ? Math.round((completedCount / bookmark.regulations.length) * 100)
              : 0

            return (
              <article key={bookmark.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
                      {bookmark.type === 'chat' ? 'Bookmarked chat' : 'Bookmarked idea'}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{bookmark.title}</h3>
                  </div>

                  <div className="text-left text-sm text-slate-500 md:text-right">
                    <p>{new Date(bookmark.createdAt).toLocaleDateString()}</p>
                    <p className="font-medium text-slate-700">{progressPercent}% complete</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600">{bookmark.summary}</p>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Checklist progress</span>
                    <span>{completedCount}/{bookmark.regulations.length}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {bookmark.regulations
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((regulation) => (
                      <label
                        key={regulation.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
                      >
                        <input
                          type="checkbox"
                          checked={regulation.completed}
                          onChange={() => toggleBookmarkItem(bookmark.id, regulation.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">{regulation.order}. {regulation.title}</p>
                            {regulation.completed && (
                              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                Complete
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{regulation.clause}</p>
                        </div>
                      </label>
                    ))}
                </div>
              </article>
            )
          })}
        </section>
      </div>
    )
  }

  const renderHistory = () => {
    const savedHistoryRows = historyEntries.map((entry) => ({
      id: entry.id,
      name: entry.title,
      score: entry.regulations.length ? 100 : 0,
      date: new Date(entry.completedAt || entry.createdAt).toLocaleDateString(),
      risk: 'Checklist Complete',
      project: 'Saved Chat',
      tags: ['Chat Bookmark', 'Safe Deployment'],
      transcript: entry.messages || [],
    }))

    const historyRows = [...savedHistoryRows]

    return (
      <div className="space-y-5">
        <section>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Assessment History</h2>
          <p className="mt-1 text-sm text-slate-500">
            Completed compliance checklists and archived chat records appear here.
          </p>
        </section>

        {historyRows.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No history entries yet. Complete a saved checklist to move it into the archive.
          </section>
        ) : (
          <section className="grid grid-cols-12 gap-4">
            <div className="col-span-12 space-y-4 xl:col-span-8">
              <div className="space-y-3">
                {historyRows.map((row) => (
                  <article
                    key={row.id || row.name}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            stroke={row.score >= 97 ? '#10b981' : '#316bf3'}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray="226"
                            strokeDashoffset={Math.round((100 - row.score) * 2.26)}
                          />
                        </svg>

                        <span className="absolute text-lg font-bold text-slate-800">{row.score}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={[
                                'rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide',
                                row.risk === 'Low Risk' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700',
                              ].join(' ')}
                            >
                              {row.risk}
                            </span>
                            <span className="text-xs font-bold text-emerald-600">Passed</span>
                          </div>

                          <span className="text-xs font-medium text-slate-500">{row.date}</span>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900">{row.name}</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Project: {row.project}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {row.tags.map((tag) => (
                            <span key={tag} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              setPrompt(row.transcript?.find(m => m.role === 'user')?.text || row.name)
                              setActiveSection('chat')
                            }}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
                          >
                            View Report
                          </button>
                          <button
                            onClick={() => {
                              const content = row.transcript?.map(m => `${m.role.toUpperCase()}:\n${m.text}`).join('\n\n') || row.name
                              const blob = new Blob([content], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${row.name.slice(0, 40).replace(/[^a-z0-9]/gi, '_')}.txt`
                              a.click()
                              URL.revokeObjectURL(url)
                              showToast('Report downloaded')
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => showToast(`${row.tags.join(', ')}`)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Sources
                          </button>

                          <button
                            onClick={() => showToast('Entry archived')}
                            className="ml-auto rounded-lg border border-slate-300 p-2 text-slate-500 transition hover:bg-slate-50"
                          >
                            <Clock3 className="h-4 w-4" />
                          </button>
                        </div>

                        {row.transcript && row.transcript.length > 0 && (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Saved chat transcript</p>
                            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                              {row.transcript.map((message) => (
                                <div
                                  key={message.id}
                                  className={[
                                    'rounded-lg border p-2 text-xs',
                                    message.role === 'user'
                                      ? 'border-blue-200 bg-blue-50 text-blue-800'
                                      : 'border-slate-200 bg-white text-slate-700',
                                  ].join(' ')}
                                >
                                  <p className="mb-1 font-semibold uppercase tracking-wide">
                                    {message.role === 'user' ? 'User' : 'Assistant'}
                                  </p>
                                  <p className="whitespace-pre-wrap">{message.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    )
  }

  const renderRiskSimulator = () => {
    return <RiskSimulationPanel />
  }

  const [settingsTab, setSettingsTab] = useState('Profile')
  const [settingsForm, setSettingsForm] = useState({ name: 'Elena Vance', email: 'e.vance@luminion.corp', org: 'Luminon Industries' })

  const renderSettings = () => {
    const tabs = ['Profile', 'Privacy & Security', 'Notifications', 'Knowledge Base', 'Danger Zone']
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your workspace, security, and AI infrastructure.</p>

        <div className="mt-6 grid grid-cols-12 gap-5">
          <aside className="col-span-12 space-y-2 lg:col-span-3">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSettingsTab(item)}
                className={[
                  'w-full rounded-lg px-3 py-2 text-left text-sm transition',
                  item === settingsTab ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                {item}
              </button>
            ))}
          </aside>

          <div className="col-span-12 rounded-lg border border-slate-200 p-4 lg:col-span-9">
            {settingsTab === 'Profile' && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Public Profile</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500">Full Name</span>
                    <input
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500">Email Address</span>
                    <input
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500">Organization</span>
                    <input
                      value={settingsForm.org}
                      onChange={(e) => setSettingsForm(f => ({ ...f, org: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => { setSettingsSaved(true); showToast('Profile saved successfully') }}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {settingsSaved ? '✔ Saved' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
            {settingsTab === 'Privacy & Security' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Privacy & Security</h3>
                <p className="text-sm text-slate-500">All chat data is processed locally. No data is sent to third-party servers.</p>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <span className="text-sm text-slate-700">Two-factor authentication</span>
                  <button onClick={() => showToast('2FA enabled')} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">Enable</button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <span className="text-sm text-slate-700">Export my data</span>
                  <button onClick={() => showToast('Data export requested')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Export</button>
                </div>
              </div>
            )}
            {settingsTab === 'Notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                {['Compliance updates', 'Bookmark reminders', 'System alerts'].map(n => (
                  <div key={n} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <span className="text-sm text-slate-700">{n}</span>
                    <button onClick={() => showToast(`${n} toggled`)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">Toggle</button>
                  </div>
                ))}
              </div>
            )}
            {settingsTab === 'Knowledge Base' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Knowledge Base</h3>
                <p className="text-sm text-slate-500">Manage the documents indexed by PolicyMind.</p>
                <button onClick={() => navigate('/admin/documents')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Open Document Manager</button>
              </div>
            )}
            {settingsTab === 'Danger Zone' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-800">Clear all bookmarks</span>
                    <button onClick={() => { setBookmarks([]); showToast('All bookmarks cleared') }} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Clear</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-800">Clear chat history</span>
                    <button onClick={() => { setMessages(starterMessages); showToast('Chat history cleared') }} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Clear</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  const renderSection = () => {
    if (activeSection === 'chat') {
      return renderAssistant()
    }

    if (activeSection === 'bookmarks') {
      return renderBookmarks()
    }

    if (activeSection === 'simulator') {
      return renderRiskSimulator()
    }

    if (activeSection === 'history') {
      return renderHistory()
    }

    if (activeSection === 'settings') {
      return renderSettings()
    }

    return renderDashboard()
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-800">
      <div className="flex min-h-screen">
        <div className="hidden xl:fixed xl:inset-y-0 xl:left-0 xl:z-40 xl:block">
          <Sidebar
            navItems={navItems}
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            onLogout={handleLogout}
          />
        </div>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-slate-900/35 xl:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div
          className={[
            'fixed left-0 top-0 z-50 h-screen transition-transform duration-200 xl:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <Sidebar
            className="shadow-2xl"
            navItems={navItems}
            activeSection={activeSection}
            onSelectSection={(id) => {
              setActiveSection(id)
              setSidebarOpen(false)
            }}
            onLogout={handleLogout}
          />
        </div>

        <main className="relative min-w-0 flex-1 xl:ml-64">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 xl:hidden"
                  aria-label="Open sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>

                <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 sm:flex sm:min-w-[320px]">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleHeaderSearch}
                    placeholder="Search regulations, policies or audits... (Enter to ask)"
                    className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
              <button
                type="button"
                  className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                  aria-label="Notifications"
              >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </button>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-800">Compliance Officer</p>
                  <p className="text-xs text-slate-500">Admin Access</p>
                </div>

                <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80"
                    alt="Compliance officer"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </header>

          <section className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 sm:px-6">
            {renderSection()}
          </section>

          {activeSection === 'chat' && (
            <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white xl:left-64">
              <ChatInput value={prompt} onChange={setPrompt} onSend={handleSend} />
            </div>
          )}

          <footer className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 text-xs text-slate-500">
              <p>PolicyMind - AI Governance & Compliance Assistant</p>
              <div className="hidden items-center gap-3 sm:flex">
                <button onClick={() => setSettingsTab('Privacy & Security') || setActiveSection('settings')} className="transition hover:text-slate-700">Privacy Policy</button>
                <button onClick={() => showToast('Audit logs are stored in the History section')} className="transition hover:text-slate-700">Audit Logs</button>
                <button onClick={() => window.open('http://localhost:8000/docs', '_blank')} className="transition hover:text-slate-700">API Docs</button>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating quick action for dashboard parity */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {activeSection === 'history' && (
        <button
          type="button"
          onClick={() => setActiveSection('chat')}
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500"
        >
          New Assessment
          <X className="h-4 w-4" />
        </button>
      )}

      {activeSection === 'dashboard' && (
        <div className="pointer-events-none fixed bottom-4 left-0 right-0 text-center text-[11px] text-slate-400">
          Powered by Local AI. Answers generated only from locally stored regulations and policy documents.
        </div>
      )}
    </div>
  )
}
