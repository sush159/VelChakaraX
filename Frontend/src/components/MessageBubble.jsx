import { Bot, User } from 'lucide-react'
import MessageActions from './MessageActions'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Extract the text body of a ## section (up to the next ## or end). */
function extractSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`##\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i')
  const m = text.match(re)
  return m ? m[1].trim() : null
}

/** Parse bullet lines (- item) from a block of text. */
function parseBullets(block) {
  if (!block) return []
  return block
    .split('\n')
    .filter((l) => /^[-*]\s/.test(l.trim()))
    .map((l) => l.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}



// ─────────────────────────────────────────────────────────────
// Sub-renderers for each ## section
// ─────────────────────────────────────────────────────────────

function RiskLevel({ block }) {
  if (!block) return null
  const levelMap = {
    PROHIBITED: 'bg-purple-100 text-purple-800 border-purple-300',
    HIGH:       'bg-red-100 text-red-800 border-red-300',
    MEDIUM:     'bg-amber-100 text-amber-800 border-amber-300',
    LOW:        'bg-emerald-100 text-emerald-800 border-emerald-300',
  }
  const match = block.match(/\b(PROHIBITED|HIGH|MEDIUM|LOW)\b/i)
  const level = match ? match[1].toUpperCase() : null
  const reasoningMatch = block.match(/Reasoning:\s*(.+)/i)
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : null

  return (
    <div className="mb-4 flex flex-col gap-2">
      {level && (
        <span
          className={[
            'inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider',
            levelMap[level] || 'bg-slate-100 text-slate-700 border-slate-300',
          ].join(' ')}
        >
          ⚡ Risk Level: {level}
        </span>
      )}
      {reasoning && <p className="text-xs text-slate-500 italic">{reasoning}</p>}
    </div>
  )
}

function ApplicableRegulations({ block }) {
  if (!block) return null
  const lines = block.split('\n')
  const regulations = []
  let current = null

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^- /.test(line)) {
      if (current) regulations.push(current)
      current = { name: line.replace(/^- /, '').trim(), article: null, why: null }
    } else if (current && /^\s{2,}- Article\/Section:\s*/i.test(line)) {
      current.article = line.replace(/^\s{2,}- Article\/Section:\s*/i, '').trim()
    } else if (current && /^\s{2,}- Why it applies:\s*/i.test(line)) {
      current.why = line.replace(/^\s{2,}- Why it applies:\s*/i, '').trim()
    }
  }
  if (current) regulations.push(current)

  if (regulations.length === 0) {
    return <p className="text-xs text-slate-400 italic">Not available in the uploaded knowledge base.</p>
  }

  return (
    <div className="space-y-2">
      {regulations.map((reg, i) => (
        <div key={i} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
          <p className="text-sm font-semibold text-blue-800">{reg.name}</p>
          {reg.article && (
            <p className="mt-1 text-xs text-slate-600">
              <span className="font-medium text-slate-700">Article/Section:</span> {reg.article}
            </p>
          )}
          {reg.why && (
            <p className="mt-0.5 text-xs text-slate-600">
              <span className="font-medium text-slate-700">Why it applies:</span> {reg.why}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function ComplianceScore({ block }) {
  if (!block) return null
  const scoreMatch = block.match(/Compliance Score:\s*(\d+)%/i)
  const statusMatch = block.match(/Status:\s*(.+)/i)
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null
  const status = statusMatch ? statusMatch[1].trim() : null

  const statusColor =
    status === 'Compliant'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : status === 'Partially Compliant'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-red-100 text-red-800 border-red-300'

  const barColor =
    score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="flex flex-col gap-2">
      {score !== null && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Compliance Score</span>
            <span className="font-bold text-slate-800">{score}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={['h-full rounded-full transition-all', barColor].join(' ')}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}
      {status && (
        <span
          className={[
            'inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold',
            statusColor,
          ].join(' ')}
        >
          {status}
        </span>
      )}
    </div>
  )
}

function PrimaryCategory({ block }) {
  if (!block) return null
  const cat = block.replace(/^Not available.*/i, '').trim()
  if (!cat) return <p className="text-xs text-slate-400 italic">Not available in the uploaded knowledge base.</p>
  return (
    <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
      {cat}
    </span>
  )
}

function DetailedAnswer({ block }) {
  const bullets = parseBullets(block || '')
  if (bullets.length === 0)
    return <p className="text-xs text-slate-400 italic">Not available in the uploaded knowledge base.</p>

  return (
    <ul className="space-y-1.5">
      {bullets.map((b, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-700">
          <span className="mt-0.5 shrink-0 text-blue-500">•</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}

function ComplianceChecklist({ block }) {
  if (!block) return null
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[✔⚠❌]/.test(l))

  if (lines.length === 0)
    return <p className="text-xs text-slate-400 italic">Not available in the uploaded knowledge base.</p>

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const icon = line[0]
        const rest = line.slice(1).trim()
        const iconClass =
          icon === '✔'
            ? 'text-emerald-600'
            : icon === '⚠'
            ? 'text-amber-500'
            : 'text-red-500'
        const rowClass =
          icon === '✔'
            ? 'border-emerald-100 bg-emerald-50/50'
            : icon === '⚠'
            ? 'border-amber-100 bg-amber-50/50'
            : 'border-red-100 bg-red-50/50'

        return (
          <div
            key={i}
            className={['flex items-start gap-2 rounded-lg border px-3 py-2 text-xs', rowClass].join(' ')}
          >
            <span className={['mt-0.5 shrink-0 text-base leading-none', iconClass].join(' ')}>{icon}</span>
            <span className="text-slate-700">{rest}</span>
          </div>
        )
      })}
    </div>
  )
}

function KnowledgeGraph({ block }) {
  if (!block) return null
  const jsonStart = block.indexOf('{')
  const jsonEnd = block.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    return <p className="text-xs text-slate-400 italic">Not available in the uploaded knowledge base.</p>
  }

  let data
  try {
    data = JSON.parse(block.slice(jsonStart, jsonEnd + 1))
  } catch {
    return (
      <pre className="overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
        {block.slice(jsonStart, jsonEnd + 1)}
      </pre>
    )
  }

  const nodes = Array.isArray(data.nodes) ? data.nodes : []
  const edges = Array.isArray(data.edges) ? data.edges : []
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  return (
    <div className="space-y-3">
      {nodes.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Nodes</p>
          <div className="flex flex-wrap gap-2">
            {nodes.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800"
              >
                <span className="opacity-50">#{n.id}</span> {n.label}
                {n.type && <span className="ml-1 rounded-sm bg-indigo-100 px-1 text-[10px]">{n.type}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      {edges.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Edges</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-400">
                <th className="pb-1.5 pr-3 font-semibold">Source</th>
                <th className="pb-1.5 pr-3 font-semibold">Relation</th>
                <th className="pb-1.5 font-semibold">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {edges.map((e, i) => (
                <tr key={i} className="text-slate-600">
                  <td className="py-1.5 pr-3">{nodeMap[e.source]?.label ?? e.source}</td>
                  <td className="py-1.5 pr-3 italic text-slate-400">{e.label}</td>
                  <td className="py-1.5">{nodeMap[e.target]?.label ?? e.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RiskList({ block }) {
  const bullets = parseBullets(block || '')
  // Also handle "- Name — explanation" lines that aren't prefixed with -
  const dashItems = (block || '')
    .split('\n')
    .filter((l) => /^- /.test(l.trim()))
    .map((l) => l.replace(/^- /, '').trim())
    .filter(Boolean)

  const items = bullets.length > 0 ? bullets : dashItems

  if (items.length === 0)
    return <p className="text-xs text-slate-400 italic">Not available in the uploaded knowledge base.</p>

  return (
    <ul className="space-y-1.5">
      {items.map((b, i) => (
        <li key={i} className="flex gap-2 rounded-lg border border-orange-100 bg-orange-50/60 px-3 py-2 text-xs text-slate-700">
          <span className="mt-0.5 shrink-0 text-orange-400">⚠</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}

function Recommendations({ block }) {
  if (!block) return null
  const lines = (block || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^✔/.test(l) || /^- /.test(l) || /^\d+[.)]\s/.test(l))
    .map((l) => l.replace(/^✔\s*/, '').replace(/^- /, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean)

  if (lines.length === 0)
    return <p className="text-xs text-slate-400 italic">Not available in the uploaded knowledge base.</p>

  return (
    <ul className="space-y-1.5">
      {lines.map((b, i) => (
        <li key={i} className="flex gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-slate-700">
          <span className="mt-0.5 shrink-0 text-emerald-600">✔</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}

function SourcesUsed({ block }) {
  if (!block) return null
  const lines = (block || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^Not available/i.test(l))
    .filter(Boolean)

  if (lines.length === 0)
    return <p className="text-xs text-slate-400 italic">Not available in the uploaded knowledge base.</p>

  return (
    <ul className="space-y-1">
      {lines.map((line, i) => (
        <li key={i} className="text-xs italic text-slate-500">
          📄 {line}
        </li>
      ))}
    </ul>
  )
}

// ─────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</h4>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main PolicyMind renderer
// ─────────────────────────────────────────────────────────────
function PolicyMindMessage({ text }) {
  const riskBlock         = extractSection(text, 'Risk Level')
  const regulationsBlock  = extractSection(text, 'Applicable Regulations')
  const scoreBlock        = extractSection(text, 'Compliance Score')
  const categoryBlock     = extractSection(text, 'Primary Category')
  const detailedBlock     = extractSection(text, 'Detailed Answer')
  const checklistBlock    = extractSection(text, 'Compliance Checklist')
  const graphBlock        = extractSection(text, 'Knowledge Graph')
  const risksBlock        = extractSection(text, 'Potential Compliance Risks')
  const recsBlock         = extractSection(text, 'Recommendations')
  const sourcesBlock      = extractSection(text, 'Sources Used')

  return (
    <div className="w-full text-sm">
      <Section title="Risk Level">
        <RiskLevel block={riskBlock} />
      </Section>

      <Section title="Compliance Score">
        <ComplianceScore block={scoreBlock} />
      </Section>

      <Section title="Primary Category">
        <PrimaryCategory block={categoryBlock} />
      </Section>

      <Section title="Applicable Regulations">
        <ApplicableRegulations block={regulationsBlock} />
      </Section>

      <Section title="Detailed Answer">
        <DetailedAnswer block={detailedBlock} />
      </Section>

      <Section title="Compliance Checklist">
        <ComplianceChecklist block={checklistBlock} />
      </Section>

      <Section title="Knowledge Graph">
        <KnowledgeGraph block={graphBlock} />
      </Section>

      <Section title="Potential Compliance Risks">
        <RiskList block={risksBlock} />
      </Section>

      <Section title="Recommendations">
        <Recommendations block={recsBlock} />
      </Section>

      <Section title="Sources Used">
        <SourcesUsed block={sourcesBlock} />
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MessageBubble — exported component
// ─────────────────────────────────────────────────────────────
const isPolicyMindResponse = (text) =>
  typeof text === 'string' && /##\s*Risk Level/i.test(text)

export default function MessageBubble({ message, onBookmark }) {
  const isUser = message.role === 'user'
  const showStructured = !isUser && isPolicyMindResponse(message.text)

  return (
    <div className={['flex', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      <div
        className={[
          'flex items-end gap-3',
          isUser ? 'flex-row-reverse max-w-[90%] sm:max-w-[78%]' : 'w-full max-w-full',
        ].join(' ')}
      >
        {/* Avatar */}
        <div
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            isUser ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-200',
          ].join(' ')}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Bubble */}
        <div className="min-w-0 flex-1">
          <div
            className={[
              'rounded-2xl px-4 py-3 shadow-sm',
              isUser
                ? 'rounded-br-md bg-blue-600 text-sm leading-6 text-white'
                : showStructured
                ? 'rounded-bl-md border border-slate-200 bg-white'
                : 'rounded-bl-md border border-slate-200 bg-white text-sm leading-6 text-slate-700',
            ].join(' ')}
          >
            {showStructured ? (
              <PolicyMindMessage text={message.text} />
            ) : (
              <span className="whitespace-pre-wrap">{message.text}</span>
            )}
          </div>

          {!isUser && <MessageActions message={message} onBookmark={onBookmark} />}
        </div>
      </div>
    </div>
  )
}