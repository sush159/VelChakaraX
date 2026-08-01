import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowRight, BrainCircuit, FileText, MapPin, Network, Search, ShieldCheck, Sparkles, Target, X } from 'lucide-react'
import { motion } from 'framer-motion'

const palette = {
  useCase: {
    bg: '#6d28d9',
    border: '#5b21b6',
    text: '#ffffff',
    chip: '#ede9fe',
    chipText: '#5b21b6',
    edge: '#6d28d9',
  },
  regulation: {
    bg: '#2563eb',
    border: '#1d4ed8',
    text: '#ffffff',
    chip: '#dbeafe',
    chipText: '#1d4ed8',
    edge: '#2563eb',
  },
  principle: {
    bg: '#16a34a',
    border: '#15803d',
    text: '#ffffff',
    chip: '#dcfce7',
    chipText: '#15803d',
    edge: '#16a34a',
  },
  risk: {
    bg: '#ef4444',
    border: '#dc2626',
    text: '#ffffff',
    chip: '#fee2e2',
    chipText: '#dc2626',
    edge: '#ef4444',
  },
  rights: {
    bg: '#14b8a6',
    border: '#0f766e',
    text: '#ffffff',
    chip: '#ccfbf1',
    chipText: '#0f766e',
    edge: '#14b8a6',
  },
} as const

type Category = keyof typeof palette

type GraphNodeData = {
  title: string
  category: Category
  icon: 'Target' | 'ShieldCheck' | 'BrainCircuit' | 'Sparkles' | 'FileText' | 'MapPin' | 'Network' | 'X'
  description: string
  relevantRegulations: string[]
  relatedPdfs: string[]
  pageNumbers: string[]
  indexedChunks: number
  relatedConcepts: string[]
  lastUpdated: string
}

type Scenario = {
  keywords: string[]
  query: string
  summary: string
  nodes: Array<GraphNodeData & { id: string }>
  edges: Array<{ id: string; source: string; target: string; label: string }>
}

const scenarios: Scenario[] = [
  {
    keywords: ['hire', 'hiring', 'screen', 'screen employees', 'recruit', 'recruitment', 'employees'],
    query: 'Can I use AI to screen or hire employees?',
    summary:
      'AI-driven hiring is considered high risk and should follow transparency, fairness, privacy, and human oversight requirements.',
    nodes: [
      {
        id: 'use-case',
        title: 'AI for Hiring / Recruitment',
        category: 'useCase',
        icon: 'Target',
        description: 'AI used to screen candidates and support hiring decisions.',
        relevantRegulations: ['EU AI Act', 'DPDP Act', 'NIST AI RMF'],
        relatedPdfs: ['AI Recruitment Governance Brief.pdf'],
        pageNumbers: ['p. 4-7'],
        indexedChunks: 14,
        relatedConcepts: ['Candidate screening', 'Decision support'],
        lastUpdated: '2h ago',
      },
      {
        id: 'high-risk',
        title: 'High Risk AI System',
        category: 'risk',
        icon: 'X',
        description: 'Employment AI can become high risk because it affects access to work.',
        relevantRegulations: ['EU AI Act'],
        relatedPdfs: ['AI Recruitment Governance Brief.pdf'],
        pageNumbers: ['p. 8'],
        indexedChunks: 6,
        relatedConcepts: ['Risk classification'],
        lastUpdated: '5h ago',
      },
      {
        id: 'eu-ai-act',
        title: 'EU AI Act',
        category: 'regulation',
        icon: 'ShieldCheck',
        description: 'Regulates high-risk AI systems used in employment and worker management.',
        relevantRegulations: ['Articles 6 & 9', 'Annex III'],
        relatedPdfs: ['EU AI Act Overview.pdf'],
        pageNumbers: ['p. 18-21'],
        indexedChunks: 18,
        relatedConcepts: ['Conformity', 'Governance'],
        lastUpdated: '1d ago',
      },
      {
        id: 'nist-ai-rmf',
        title: 'NIST AI RMF',
        category: 'regulation',
        icon: 'FileText',
        description: 'Guides AI risk measurement and management.',
        relevantRegulations: ['Measure', 'Manage'],
        relatedPdfs: ['NIST AI RMF Summary.pdf'],
        pageNumbers: ['p. 1-3'],
        indexedChunks: 9,
        relatedConcepts: ['Monitoring', 'Risk management'],
        lastUpdated: '5h ago',
      },
      {
        id: 'transparency',
        title: 'Transparency',
        category: 'principle',
        icon: 'Sparkles',
        description: 'Applicants should know when AI is used.',
        relevantRegulations: ['EU AI Act'],
        relatedPdfs: ['Transparency Notice.pdf'],
        pageNumbers: ['p. 2-3'],
        indexedChunks: 7,
        relatedConcepts: ['Disclosure'],
        lastUpdated: '3h ago',
      },
      {
        id: 'human-oversight',
        title: 'Human Oversight',
        category: 'principle',
        icon: 'BrainCircuit',
        description: 'A human must review and override AI recommendations.',
        relevantRegulations: ['EU AI Act', 'NIST AI RMF'],
        relatedPdfs: ['Governance Controls.pdf'],
        pageNumbers: ['p. 12-13'],
        indexedChunks: 8,
        relatedConcepts: ['Reviewability'],
        lastUpdated: '6h ago',
      },
      {
        id: 'personal-data',
        title: 'Personal Data',
        category: 'rights',
        icon: 'MapPin',
        description: 'Candidate data must be handled lawfully and securely.',
        relevantRegulations: ['DPDP Act'],
        relatedPdfs: ['DPDP Compliance Note.pdf'],
        pageNumbers: ['p. 10'],
        indexedChunks: 9,
        relatedConcepts: ['Privacy'],
        lastUpdated: '8h ago',
      },
      {
        id: 'fairness',
        title: 'Fairness',
        category: 'principle',
        icon: 'Sparkles',
        description: 'Selection logic should produce equitable outcomes.',
        relevantRegulations: ['OECD AI Principles', 'NIST AI RMF'],
        relatedPdfs: ['Fairness Controls.pdf'],
        pageNumbers: ['p. 14-16'],
        indexedChunks: 10,
        relatedConcepts: ['Testing'],
        lastUpdated: '9h ago',
      },
      {
        id: 'bias-discrimination',
        title: 'Bias & Discrimination',
        category: 'risk',
        icon: 'X',
        description: 'Biased models can unfairly exclude qualified candidates.',
        relevantRegulations: ['NIST AI RMF'],
        relatedPdfs: ['Bias Risk Assessment.pdf'],
        pageNumbers: ['p. 3-5'],
        indexedChunks: 6,
        relatedConcepts: ['Fairness'],
        lastUpdated: '7h ago',
      },
    ],
    edges: [
      { id: 'e1', source: 'use-case', target: 'high-risk', label: 'classified' },
      { id: 'e2', source: 'use-case', target: 'eu-ai-act', label: 'applies' },
      { id: 'e3', source: 'use-case', target: 'nist-ai-rmf', label: 'guides' },
      { id: 'e4', source: 'use-case', target: 'transparency', label: 'requires' },
      { id: 'e5', source: 'use-case', target: 'human-oversight', label: 'requires' },
      { id: 'e6', source: 'use-case', target: 'personal-data', label: 'involves' },
      { id: 'e7', source: 'use-case', target: 'fairness', label: 'requires' },
      { id: 'e8', source: 'use-case', target: 'bias-discrimination', label: 'may lead to' },
    ],
  },
  {
    keywords: ['credit', 'loan', 'lending', 'scoring'],
    query: 'Can I use AI for credit scoring?',
    summary: 'Credit scoring requires transparency, explainability, data security, and fairness controls.',
    nodes: [
      {
        id: 'use-case',
        title: 'AI for Credit Scoring',
        category: 'useCase',
        icon: 'Target',
        description: 'AI that ranks applicants for eligibility and repayment risk.',
        relevantRegulations: ['EU AI Act', 'DPDP Act'],
        relatedPdfs: ['Credit AI Assessment.pdf'],
        pageNumbers: ['p. 2-4'],
        indexedChunks: 12,
        relatedConcepts: ['Eligibility'],
        lastUpdated: '3h ago',
      },
      {
        id: 'high-risk',
        title: 'High Risk AI System',
        category: 'risk',
        icon: 'X',
        description: 'A scoring system can affect access to essential services.',
        relevantRegulations: ['EU AI Act'],
        relatedPdfs: ['Credit AI Assessment.pdf'],
        pageNumbers: ['p. 5'],
        indexedChunks: 5,
        relatedConcepts: ['Impact'],
        lastUpdated: '2d ago',
      },
      {
        id: 'eu-ai-act',
        title: 'EU AI Act',
        category: 'regulation',
        icon: 'ShieldCheck',
        description: 'Regulates high-impact AI systems and governance obligations.',
        relevantRegulations: ['Articles 6 & 9', 'Annex III'],
        relatedPdfs: ['EU AI Act Overview.pdf'],
        pageNumbers: ['p. 18-21'],
        indexedChunks: 18,
        relatedConcepts: ['Conformity'],
        lastUpdated: '1d ago',
      },
      {
        id: 'nist-ai-rmf',
        title: 'NIST AI RMF',
        category: 'regulation',
        icon: 'FileText',
        description: 'Guides measurement and management of AI risks.',
        relevantRegulations: ['Measure', 'Manage'],
        relatedPdfs: ['NIST AI RMF Summary.pdf'],
        pageNumbers: ['p. 1-3'],
        indexedChunks: 9,
        relatedConcepts: ['Monitoring'],
        lastUpdated: '5h ago',
      },
      {
        id: 'transparency',
        title: 'Transparency',
        category: 'principle',
        icon: 'Sparkles',
        description: 'Users should understand why a score was produced.',
        relevantRegulations: ['EU AI Act'],
        relatedPdfs: ['Transparency Notice.pdf'],
        pageNumbers: ['p. 2-3'],
        indexedChunks: 7,
        relatedConcepts: ['Disclosure'],
        lastUpdated: '3h ago',
      },
      {
        id: 'human-oversight',
        title: 'Human Oversight',
        category: 'principle',
        icon: 'BrainCircuit',
        description: 'A human should be able to review model output.',
        relevantRegulations: ['NIST AI RMF'],
        relatedPdfs: ['Governance Controls.pdf'],
        pageNumbers: ['p. 12-13'],
        indexedChunks: 8,
        relatedConcepts: ['Review'],
        lastUpdated: '6h ago',
      },
      {
        id: 'personal-data',
        title: 'Personal Data',
        category: 'rights',
        icon: 'MapPin',
        description: 'Financial and identity data must be protected.',
        relevantRegulations: ['DPDP Act'],
        relatedPdfs: ['DPDP Compliance Note.pdf'],
        pageNumbers: ['p. 10'],
        indexedChunks: 9,
        relatedConcepts: ['Privacy'],
        lastUpdated: '8h ago',
      },
      {
        id: 'fairness',
        title: 'Fairness',
        category: 'principle',
        icon: 'Sparkles',
        description: 'Outcomes should remain equitable across groups.',
        relevantRegulations: ['OECD AI Principles'],
        relatedPdfs: ['Fairness Controls.pdf'],
        pageNumbers: ['p. 14-16'],
        indexedChunks: 10,
        relatedConcepts: ['Testing'],
        lastUpdated: '9h ago',
      },
      {
        id: 'bias-discrimination',
        title: 'Bias & Discrimination',
        category: 'risk',
        icon: 'X',
        description: 'Poorly designed scoring can create unfair outcomes.',
        relevantRegulations: ['NIST AI RMF'],
        relatedPdfs: ['Bias Risk Assessment.pdf'],
        pageNumbers: ['p. 3-5'],
        indexedChunks: 6,
        relatedConcepts: ['Fairness'],
        lastUpdated: '7h ago',
      },
    ],
    edges: [
      { id: 'e1', source: 'use-case', target: 'high-risk', label: 'classified' },
      { id: 'e2', source: 'use-case', target: 'eu-ai-act', label: 'applies' },
      { id: 'e3', source: 'use-case', target: 'nist-ai-rmf', label: 'guides' },
      { id: 'e4', source: 'use-case', target: 'transparency', label: 'requires' },
      { id: 'e5', source: 'use-case', target: 'human-oversight', label: 'requires' },
      { id: 'e6', source: 'use-case', target: 'personal-data', label: 'involves' },
      { id: 'e7', source: 'use-case', target: 'fairness', label: 'requires' },
      { id: 'e8', source: 'use-case', target: 'bias-discrimination', label: 'may lead to' },
    ],
  },
]

const iconMap = {
  Target,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  FileText,
  MapPin,
  Network,
  X,
}

const radialPositions = [
  { id: 'high-risk', x: 500, y: 70 },
  { id: 'eu-ai-act', x: 215, y: 140 },
  { id: 'nist-ai-rmf', x: 785, y: 140 },
  { id: 'transparency', x: 120, y: 360 },
  { id: 'human-oversight', x: 900, y: 360 },
  { id: 'personal-data', x: 260, y: 650 },
  { id: 'fairness', x: 740, y: 650 },
  { id: 'bias-discrimination', x: 500, y: 770 },
]

function getScenario(query: string) {
  const normalized = query.toLowerCase()
  return scenarios.find((scenario) => scenario.keywords.some((keyword) => normalized.includes(keyword))) ?? scenarios[0]
}

function labelForCategory(category: Category) {
  switch (category) {
    case 'useCase':
      return 'Use Case'
    case 'regulation':
      return 'Regulation / Standard'
    case 'principle':
      return 'Principle / Requirement'
    case 'risk':
      return 'Risk'
    case 'rights':
      return 'Rights / Protection'
  }
}

function GraphNode({ data }: NodeProps<GraphNodeData>) {
  const isCenter = data.category === 'useCase'
  const Icon = iconMap[data.icon]
  const colors = palette[data.category]

  return (
    <div
      className={[
        'select-none border shadow-sm transition duration-200',
        data.highlight ? 'ring-4 ring-blue-100' : 'opacity-70',
        isCenter
          ? 'flex h-[176px] w-[176px] items-center justify-center rounded-full px-5 text-center'
          : 'flex h-[140px] w-[140px] items-center justify-center rounded-full px-4 text-center',
      ].join(' ')}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <Handle type="target" position={Position.Top} className="!border-transparent !bg-transparent" />
      <div className="flex flex-col items-center justify-center gap-2 px-3 text-center">
        <div className="rounded-full bg-white/15 p-3 text-white">
          <Icon className={isCenter ? 'h-8 w-8' : 'h-6 w-6'} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">{labelForCategory(data.category)}</p>
          <p className={isCenter ? 'text-[15px] font-bold leading-tight text-white whitespace-pre-line' : 'text-[12px] font-semibold leading-tight text-white whitespace-pre-line'}>{data.title}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!border-transparent !bg-transparent" />
    </div>
  )
}

const nodeTypes: NodeTypes = { graphNode: GraphNode }

function KnowledgeGraphCanvas() {
  const [query, setQuery] = useState('Can I use AI to screen or hire employees?')
  const [scenario, setScenario] = useState(() => getScenario(query))
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [instanceReady, setInstanceReady] = useState(false)

  const highlightedIds = useMemo(() => {
    if (!selectedNodeId) {
      return new Set(["use-case", ...scenario.nodes.map((node) => node.id)])
    }

    const connected = new Set<string>(['use-case', selectedNodeId])
    scenario.edges.forEach((edge) => {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId || selectedNodeId === 'use-case') {
        connected.add(edge.source)
        connected.add(edge.target)
      }
    })
    return connected
  }, [scenario, selectedNodeId])

  const nodes = useMemo<Array<Node<GraphNodeData>>>(
    () =>
      scenario.nodes.map((node) => {
        const position = node.id === 'use-case' ? { x: 460, y: 260 } : radialPositions.find((item) => item.id === node.id) ?? { x: 0, y: 0 }
        return {
          id: node.id,
          type: 'graphNode',
          position,
          draggable: false,
          data: {
            ...node,
            highlight: highlightedIds.has(node.id),
          },
        }
      }),
    [highlightedIds, scenario],
  )

  const edges = useMemo(() => {
    return scenario.edges.map((edge) => {
      const isActive = !selectedNodeId || edge.source === selectedNodeId || edge.target === selectedNodeId || selectedNodeId === 'use-case'
      const sourceNode = scenario.nodes.find((node) => node.id === edge.source)
      const edgeColor = sourceNode ? palette[sourceNode.category].edge : '#64748b'

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep' as const,
        label: edge.label,
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
          opacity: isActive ? 1 : 0.22,
        },
        labelStyle: {
          fill: '#6b7280',
          fontSize: 11,
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: 'rgba(255,255,255,0.9)',
        },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 999,
      }
    })
  }, [scenario, selectedNodeId])

  const currentSummary = scenario.summary
  const selectedNode = scenario.nodes.find((node) => node.id === selectedNodeId) ?? null

  useEffect(() => {
    if (!instanceReady) return
    const id = window.requestAnimationFrame(() => {
      const svg = document.querySelector('.react-flow__viewport')
      if (svg) {
        // no-op anchor to avoid initial blank renders in some browsers
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [instanceReady, scenario])

  const handleGenerate = useCallback(() => {
    const nextScenario = getScenario(query)
    setScenario(nextScenario)
    setSelectedNodeId('use-case')
  }, [query])

  const handleClear = useCallback(() => {
    const fallback = scenarios[0]
    setQuery(fallback.query)
    setScenario(fallback)
    setSelectedNodeId(null)
  }, [])

  const handleSearchNode = useCallback(() => {
    const normalized = query.trim().toLowerCase()
    const match = scenario.nodes.find(
      (node) => node.title.toLowerCase().includes(normalized) || node.relevantRegulations.some((item) => item.toLowerCase().includes(normalized)),
    )
    if (match) {
      setSelectedNodeId(match.id)
    }
  }, [query, scenario.nodes])

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-start justify-end">
          <div className="text-right">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Query-based Knowledge Graph</h2>
            <p className="mt-1 text-sm text-slate-500">Dynamic - shows only relevant concepts</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4 lg:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-[1800px] gap-5">
          <div className="flex min-w-0 flex-[3] flex-col gap-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex-1 space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">User Question</label>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3 shadow-inner">
                    <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3.5 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
                      <Search className="h-5 w-5 text-slate-400" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleGenerate()
                        }}
                        placeholder='"Can I use AI to screen or hire employees?"'
                        className="w-full border-0 bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pb-1">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Graph
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Legend</span>
                <LegendPill color="bg-violet-500" label="Use Case" />
                <LegendPill color="bg-blue-500" label="Regulation / Standard" />
                <LegendPill color="bg-emerald-500" label="Principle / Requirement" />
                <LegendPill color="bg-red-500" label="Risk" />
                <LegendPill color="bg-teal-500" label="Rights / Protection" />
                <LegendPill color="bg-slate-950" label="Relationship" arrow />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Interactive Relationship Map</p>
                    <p className="text-sm text-slate-500">Highlight connections, zoom, pan, and inspect any node.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSearchNode}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <Network className="h-4 w-4" />
                      Search Node
                    </button>
                  </div>
                </div>

                <div className="h-[760px] overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnScroll
                    zoomOnScroll
                    zoomOnDoubleClick={false}
                    fitView
                    fitViewOptions={{ padding: 0.12 }}
                    onInit={() => setInstanceReady(true)}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background gap={28} size={1} color="#e2e8f0" />
                    <Controls position="bottom-right" showInteractive={false} className="!rounded-2xl !border-slate-200 !bg-white !shadow-sm" />
                    <MiniMap
                      pannable
                      zoomable
                      maskColor="rgba(255,255,255,0.75)"
                      nodeColor={(node) => palette[(node.data as GraphNodeData).category].edge}
                    />
                  </ReactFlow>
                </div>
              </div>

              <div className="sticky top-5 flex h-fit flex-col gap-4">
                <InfoCard
                  title="Legend"
                  icon={<Network className="h-4 w-4" />}
                  content={(
                    <div className="space-y-2 text-sm text-slate-600">
                      <LineItem label="Purple = Use Case" />
                      <LineItem label="Blue = Regulation" />
                      <LineItem label="Green = Requirement" />
                      <LineItem label="Red = Risk" />
                      <LineItem label="Teal = Rights" />
                    </div>
                  )}
                />

                <InfoCard
                  title="How to Read"
                  icon={<MapPin className="h-4 w-4" />}
                  content={(
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>Purple = Use Case</p>
                      <p>Blue = Regulation</p>
                      <p>Green = Requirement</p>
                      <p>Red = Risk</p>
                      <p>Teal = Rights</p>
                      <p>Arrows = Relationships</p>
                    </div>
                  )}
                />

                <InfoCard
                  title="Key Insight"
                  icon={<Sparkles className="h-4 w-4" />}
                  content={<p className="text-sm leading-6 text-slate-600">{currentSummary}</p>}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <KnowledgeDrawer node={selectedNode} onClose={() => setSelectedNodeId(null)} />
    </div>
  )
}

function LegendPill({ color, label, arrow = false }: { color: string; label: string; arrow?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
      <span className={['h-2.5 w-2.5 rounded-full', color].join(' ')} />
      {label}
      {arrow ? <ArrowRight className="h-3.5 w-3.5 text-slate-900" /> : null}
    </span>
  )
}

function LineItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
      {label}
    </div>
  )
}

function InfoCard({ title, icon, content }: { title: string; icon: React.ReactNode; content: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="rounded-lg bg-slate-100 p-2 text-slate-700">{icon}</span>
        {title}
      </div>
      <div className="mt-4">{content}</div>
    </div>
  )
}

function KnowledgeDrawer({ node, onClose }: { node: (GraphNodeData & { id: string }) | null; onClose: () => void }) {
  if (!node) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Node Details</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{node.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{labelForCategory(node.category)}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <Section title="Description" value={node.description} />
        <Section title="Relevant Regulations" value={node.relevantRegulations.join(', ')} />
        <Section title="Related PDFs" value={node.relatedPdfs.join(', ')} />
        <Section title="Page Numbers" value={node.pageNumbers.join(', ')} />
        <Section title="Indexed Chunks" value={String(node.indexedChunks)} />
        <div>
          <p className="text-sm font-semibold text-slate-900">Related Concepts</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {node.relatedConcepts.map((concept) => (
              <span key={concept} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                {concept}
              </span>
            ))}
          </div>
        </div>
        <Section title="Last Updated" value={node.lastUpdated} />
      </div>

      <div className="border-t border-slate-200 p-5">
        <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">
          <FileText className="h-4 w-4" />
          Open Source PDF
        </button>
      </div>
    </div>
  )
}

function Section({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  )
}

export default function KnowledgeGraph() {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphCanvas />
    </ReactFlowProvider>
  )
}
