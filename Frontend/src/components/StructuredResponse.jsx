import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, BookOpen, ShieldAlert, Zap, XCircle } from 'lucide-react'
import { useState } from 'react'

const parseStructuredText = (text) => {
  const sections = {}
  const regex = /##\s+(.+?)\n([\s\S]*?)(?=##\s+|$)/g
  let match
  let found = false
  while ((match = regex.exec(text)) !== null) {
    found = true
    sections[match[1].trim()] = match[2].trim()
  }
  return found ? sections : null
}

const CircularProgress = ({ score }) => {
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  
  let colorClass = 'text-emerald-500'
  if (score < 50) colorClass = 'text-red-500'
  else if (score < 80) colorClass = 'text-orange-500'
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-16 w-16 -rotate-90 transform">
        <circle
          className="text-slate-200"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="32"
          cy="32"
        />
        <circle
          className={colorClass}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="32"
          cy="32"
        />
      </svg>
      <span className="absolute text-sm font-bold text-slate-700">{score}%</span>
    </div>
  )
}

export default function StructuredResponse({ text }) {
  const sections = parseStructuredText(text)
  const [showJson, setShowJson] = useState(false)
  
  if (!sections) {
    return <div className="whitespace-pre-wrap">{text}</div>
  }
  
  const getRiskColor = (level) => {
    if (/high|prohibited/i.test(level)) return 'bg-red-100 text-red-700 border-red-200'
    if (/medium/i.test(level)) return 'bg-orange-100 text-orange-700 border-orange-200'
    if (/low/i.test(level)) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }
  
  const renderList = (text) => {
    if (!text || /not available/i.test(text)) return <p className="text-sm italic text-slate-500">Not available in the knowledge base.</p>
    const items = text.split('\n').filter(i => i.trim().length > 0)
    return (
      <ul className="space-y-2">
        {items.map((item, i) => {
          const isCheck = item.includes('✔')
          const isCross = item.includes('❌')
          const isWarn = item.includes('⚠')
          
          let Icon = () => <span className="mr-2 text-blue-500 font-bold">•</span>
          if (isCheck) Icon = () => <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          if (isCross) Icon = () => <XCircle className="mr-2 h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          if (isWarn) Icon = () => <AlertTriangle className="mr-2 h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          
          const cleanedText = item.replace(/^[-\*•✔❌⚠]\s*/, '')
          return (
            <li key={i} className="flex items-start text-sm text-slate-700">
              <Icon />
              <span>{cleanedText}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  // Parse specific sections
  const riskRaw = sections['Risk Level'] || ''
  const riskLevel = riskRaw.split('\n')[0]?.replace(/[\[\]]/g, '').trim() || 'UNKNOWN'
  const riskReason = riskRaw.split('\n').slice(1).join(' ').replace(/^Reasoning:\s*/i, '').trim()
  
  const scoreRaw = sections['Compliance Score'] || ''
  const scoreMatch = scoreRaw.match(/Score:\s*(\d+)/i)
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0
  const statusMatch = scoreRaw.match(/Status:\s*(.+)/i)
  const status = statusMatch ? statusMatch[1].replace(/[\[\]]/g, '').trim() : 'Unknown'
  
  return (
    <div className="space-y-5 rounded-lg mt-2">
      
      {/* Risk & Score Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <CircularProgress score={score} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compliance Status</p>
            <p className="text-lg font-bold text-slate-800">{status}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Risk Level</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold uppercase ${getRiskColor(riskLevel)}`}>
            {/high|prohibited/i.test(riskLevel) && <ShieldAlert className="h-4 w-4" />}
            {riskLevel}
          </span>
        </div>
      </div>
      
      {/* Primary Category & Reasoning */}
      {sections['Primary Category'] && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-md bg-blue-100 px-2 py-1 font-semibold text-blue-700">
            {sections['Primary Category']}
          </span>
          {riskReason && <span className="text-slate-600 border-l border-slate-300 pl-2">{riskReason}</span>}
        </div>
      )}
      
      {/* Two Column Layout for details */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-4">
          {sections['Applicable Regulations'] && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-900">
                <BookOpen className="h-4 w-4 text-blue-600" /> Applicable Regulations
              </h4>
              {renderList(sections['Applicable Regulations'])}
            </div>
          )}
          
          {sections['Detailed Answer'] && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-bold text-slate-800">Detailed Analysis</h4>
              {renderList(sections['Detailed Answer'])}
            </div>
          )}
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {sections['Compliance Checklist'] && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Compliance Checklist
              </h4>
              {renderList(sections['Compliance Checklist'])}
            </div>
          )}
          
          {sections['Potential Compliance Risks'] && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-orange-900">
                <AlertTriangle className="h-4 w-4 text-orange-600" /> Potential Risks
              </h4>
              {renderList(sections['Potential Compliance Risks'])}
            </div>
          )}
          
          {sections['Recommendations'] && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900">
                <Zap className="h-4 w-4 text-emerald-600" /> Recommendations
              </h4>
              {renderList(sections['Recommendations'])}
            </div>
          )}
        </div>
      </div>
      
      {/* Sources */}
      {sections['Sources Used'] && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          <h4 className="mb-2 font-bold uppercase tracking-wider text-slate-400">Sources Used</h4>
          {renderList(sections['Sources Used'])}
        </div>
      )}
      
      {/* Knowledge Graph JSON */}
      {sections['Knowledge Graph'] && sections['Knowledge Graph'].includes('{') && (
        <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden">
          <button 
            onClick={() => setShowJson(!showJson)}
            className="flex w-full items-center justify-between bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-purple-400" /> View Raw Knowledge Graph Data
            </span>
            {showJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showJson && (
            <div className="p-4 overflow-x-auto">
              <pre className="text-xs text-slate-300">
                {sections['Knowledge Graph'].replace(/^```json|```$/gm, '').trim()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
