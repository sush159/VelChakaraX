import { useState } from 'react';
import { Search, X, Shield, FileText, CheckCircle2, AlertTriangle, UserCircle2 } from 'lucide-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node Component
const CustomNode = ({ data }) => {
  const { label, type } = data;
  
  let bg = 'bg-slate-500';
  let Icon = FileText;
  
  if (type === 'Use Case') {
    bg = 'bg-[#8B5CF6]'; // Purple
    Icon = UserCircle2;
  } else if (type === 'Regulation') {
    bg = 'bg-[#3B82F6]'; // Blue
    Icon = Shield;
  } else if (type === 'Requirement') {
    bg = 'bg-[#10B981]'; // Green
    Icon = CheckCircle2;
  } else if (type === 'Risk') {
    bg = 'bg-[#EF4444]'; // Red
    Icon = AlertTriangle;
  } else if (type === 'Rights') {
    bg = 'bg-[#14B8A6]'; // Teal
    Icon = Shield; // Close enough for Rights
  }

  return (
    <div className={`px-4 py-3 shadow-md rounded-3xl ${bg} text-white border-2 border-white/20 min-w-[150px] text-center relative`}>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/20 p-1 rounded-full backdrop-blur-sm">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="text-[10px] uppercase font-bold text-white/80 tracking-wider mb-1 mt-2">
        {type.toUpperCase()}
      </div>
      <div className="font-semibold text-sm">{label}</div>
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const initialNodes = [
  { id: '1', type: 'custom', position: { x: 250, y: 250 }, data: { label: 'AI for Hiring / Recruitment', type: 'Use Case' } },
  { id: '2', type: 'custom', position: { x: 50, y: 100 }, data: { label: 'EU AI Act', type: 'Regulation' } },
  { id: '3', type: 'custom', position: { x: 250, y: 20 }, data: { label: 'High Risk AI System', type: 'Risk' } },
  { id: '4', type: 'custom', position: { x: 450, y: 100 }, data: { label: 'NIST RMF', type: 'Regulation' } },
  { id: '5', type: 'custom', position: { x: -50, y: 250 }, data: { label: 'Transparency', type: 'Requirement' } },
  { id: '6', type: 'custom', position: { x: 550, y: 250 }, data: { label: 'Human Oversight', type: 'Requirement' } },
  { id: '7', type: 'custom', position: { x: 50, y: 400 }, data: { label: 'Personal Data', type: 'Rights' } },
  { id: '8', type: 'custom', position: { x: 450, y: 400 }, data: { label: 'Fairness', type: 'Requirement' } },
  { id: '9', type: 'custom', position: { x: 250, y: 550 }, data: { label: 'Bias & Discrimination', type: 'Risk' } },
];

const initialEdges = [
  { id: 'e2-1', source: '2', target: '1', label: 'applies', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-3', source: '1', target: '3', label: 'classified', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e4-1', source: '4', target: '1', label: 'guides', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-5', source: '1', target: '5', label: 'requires', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-6', source: '1', target: '6', label: 'requires', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-7', source: '1', target: '7', label: 'involves', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-8', source: '1', target: '8', label: 'requires', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-9', source: '1', target: '9', label: 'may lead to', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
];

export default function AdminKnowledgeGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');
  const [nodeSearchOpen, setNodeSearchOpen] = useState(false);

  // Dim nodes that don't match the search
  const displayNodes = nodeSearch
    ? nodes.map(n => ({
        ...n,
        style: n.data.label.toLowerCase().includes(nodeSearch.toLowerCase())
          ? {}
          : { opacity: 0.25 },
      }))
    : nodes;

  const handleGenerate = async () => {
    if (!query.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Try to parse the JSON embedded in the answer
        const graphMatch = data.answer.match(/## Knowledge Graph\s*```json\n([\s\S]*?)\n```/i) || 
                           data.answer.match(/## Knowledge Graph\s*(\{[\s\S]*?\})/i);
        
        if (graphMatch && graphMatch[1]) {
          const parsedGraph = JSON.parse(graphMatch[1]);
          if (parsedGraph.nodes && parsedGraph.edges) {
            // Very simple auto-layout for newly generated nodes
            const newNodes = parsedGraph.nodes.map((n, i) => ({
              id: n.id,
              type: 'custom',
              position: { x: (i % 3) * 200, y: Math.floor(i / 3) * 150 }, // simple grid
              data: { label: n.label, type: n.type || 'Use Case' }
            }));
            
            const newEdges = parsedGraph.edges.map(e => ({
              id: `e${e.source}-${e.target}`,
              source: e.source,
              target: e.target,
              label: e.label,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed }
            }));
            
            setNodes(newNodes);
            setEdges(newEdges);
            return;
          }
        }
      }
      
      // If parsing fails or backend fails, revert to default graph (demo mode)
      setNodes(initialNodes);
      setEdges(initialEdges);
      
    } catch (e) {
      console.error(e);
      // Fallback to demo
      setNodes(initialNodes);
      setEdges(initialEdges);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Search Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">User Question</h3>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Can I use AI to screen or hire employees?"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
          >
            {isGenerating ? 'Generating...' : 'Generate Graph'}
          </button>
          <button 
            onClick={handleClear}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>

        {/* Legend Bar */}
        <div className="mt-6 flex items-center gap-6 text-sm text-slate-600 border-t border-slate-100 pt-4 overflow-x-auto pb-2">
          <span className="font-semibold text-slate-900">Legend</span>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#8B5CF6]"></div> Use Case</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div> Regulation / Standard</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10B981]"></div> Principle / Requirement</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#EF4444]"></div> Risk</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#14B8A6]"></div> Rights / Protection</div>
          <div className="flex items-center gap-2 ml-4 font-medium">Relationship &rarr;</div>
        </div>
      </div>

      <div className="flex gap-6 h-[700px]">
        {/* Graph Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between z-10 bg-white/80 backdrop-blur-sm absolute top-0 w-full">
            <div>
              <h3 className="font-semibold text-slate-900">Interactive Relationship Map</h3>
              <p className="text-xs text-slate-500">Highlight connections, zoom, pan, and inspect any node.</p>
            </div>
            <div className="relative">
              {nodeSearchOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={nodeSearch}
                    onChange={e => setNodeSearch(e.target.value)}
                    placeholder="Search node..."
                    className="w-40 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button onClick={() => { setNodeSearch(''); setNodeSearchOpen(false) }} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setNodeSearchOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Search className="h-3 w-3" /> Search Node
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 w-full h-full mt-16">
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#f1f5f9" gap={16} />
              <Controls className="bg-white border-slate-200 rounded-lg overflow-hidden shadow-sm !m-4" />
              <MiniMap className="!m-4 rounded-xl border border-slate-200 shadow-sm" maskColor="rgba(241, 245, 249, 0.7)" />
            </ReactFlow>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-72 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 font-semibold text-slate-900">
              <Shield className="h-4 w-4 text-blue-600" />
              Legend
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></div> Purple = Use Case</li>
              <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div> Blue = Regulation</li>
              <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div> Green = Requirement</li>
              <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div> Red = Risk</li>
              <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]"></div> Teal = Rights</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 font-semibold text-slate-900">
              <FileText className="h-4 w-4 text-blue-600" />
              How to Read
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nodes represent entities from your document knowledge base. Edges show direct relationships (e.g. A "requires" B, or A is "classified" as B).
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 font-semibold text-blue-900">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              Key Insight
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              AI-driven hiring is considered high risk and should follow transparency, fairness, and human oversight requirements to protect personal data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
