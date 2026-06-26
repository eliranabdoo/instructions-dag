'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CodeNode from '@/components/CodeNode';
import LLMSettingsPanel from '@/components/LLMSettingsPanel';
import DAGPanel from '@/components/DAGPanel';
import { DAGContext } from '@/lib/dag-context';
import { topologicalSort, executeCode, getNodeInputs } from '@/lib/dag-utils';
import { useDAGs } from '@/lib/use-dags';
import { createClient } from '@/lib/supabase';
import type { NodeData, LLMSettings } from '@/types';

const nodeTypes = { codeNode: CodeNode };

const DEFAULT_LLM: LLMSettings = { apiKey: '', baseUrl: '', model: 'gpt-4o' };

let counter = 1;

function makeNode(position = { x: 150, y: 150 }): Node<NodeData> {
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'codeNode',
    position,
    data: {
      title: `Node ${counter++}`,
      code: '// Access parent outputs via `inputs` object\n// Use `return` to pass output downstream\n\nreturn "hello from node";\n',
      instructions: '',
      output: null,
      error: null,
      status: 'idle',
      activeTab: 'code',
    },
  };
}

function DAGEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([
    makeNode({ x: 200, y: 180 }),
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showDAGPanel, setShowDAGPanel] = useState(false);
  const [llmSettings, setLLMSettings] = useState<LLMSettings>(DEFAULT_LLM);
  const [runningAll, setRunningAll] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const llmRef = useRef(llmSettings);
  llmRef.current = llmSettings;

  const { saving, dagName, setDagName, dags, loadList, loadDAG, saveDAG, newDAG } = useDAGs();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dag-llm-settings');
      if (saved) setLLMSettings(JSON.parse(saved));
    } catch {}

    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const saveLLMSettings = useCallback((s: LLMSettings) => {
    setLLMSettings(s);
    localStorage.setItem('dag-llm-settings', JSON.stringify(s));
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<NodeData>) => {
    setNodes(nds =>
      nds.map(n => (n.id === id ? { ...n, data: { ...n.data, ...updates } } : n))
    );
  }, [setNodes]);

  const runNode = useCallback(async (id: string) => {
    const node = nodesRef.current.find(n => n.id === id);
    if (!node) return;
    updateNode(id, { status: 'running', output: null, error: null });
    const inputs = getNodeInputs(id, nodesRef.current, edgesRef.current);
    const { output, error } = await executeCode(node.data.code, inputs);
    updateNode(id, { status: error ? 'error' : 'success', output, error });
  }, [updateNode]);

  const rewriteNode = useCallback(async (id: string) => {
    const node = nodesRef.current.find(n => n.id === id);
    const { apiKey, baseUrl, model } = llmRef.current;
    if (!node || !apiKey) return;
    updateNode(id, { status: 'running' });
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: node.data.instructions, code: node.data.code, apiKey, baseUrl, model }),
      });
      if (!res.ok) { const { error } = await res.json(); throw new Error(error); }
      const { code } = await res.json();
      updateNode(id, { code, status: 'idle', activeTab: 'code' });
    } catch (e) {
      updateNode(id, { status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  }, [updateNode]);

  const runAll = useCallback(async () => {
    setRunningAll(true);
    const sorted = topologicalSort(nodesRef.current, edgesRef.current);
    for (const node of sorted) await runNode(node.id);
    setRunningAll(false);
  }, [runNode]);

  const addNode = useCallback(() => {
    const spread = nodes.length * 30;
    setNodes(nds => [...nds, makeNode({ x: 200 + spread % 400, y: 180 + Math.floor(spread / 400) * 300 })]);
  }, [nodes.length, setNodes]);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges(eds =>
      addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds)
    );
  }, [setEdges]);

  const handleLoadDAG = useCallback(async (id: string) => {
    const result = await loadDAG(id);
    if (result) {
      setNodes(result.nodes);
      setEdges(result.edges);
    }
    setShowDAGPanel(false);
  }, [loadDAG, setNodes, setEdges]);

  const handleNewDAG = useCallback(() => {
    newDAG();
    counter = 1;
    setNodes([makeNode({ x: 200, y: 180 })]);
    setEdges([]);
    setShowDAGPanel(false);
  }, [newDAG, setNodes, setEdges]);

  const handleSignOut = useCallback(async () => {
    await createClient().auth.signOut();
    window.location.href = '/login';
  }, []);

  const llmConfigured = !!llmSettings.apiKey;

  return (
    <DAGContext.Provider value={{ updateNode, runNode, rewriteNode, llmConfigured }}>
      <div className="w-full h-screen flex flex-col bg-slate-50">
        {/* Toolbar */}
        <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="flex items-center gap-2 mr-1">
            <span className="text-base">⬡</span>
            <span className="font-bold text-gray-900 text-sm tracking-tight">instruction-dag</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />

          {/* DAG name */}
          <input
            className="text-sm text-gray-700 font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-blue-400 transition-colors px-1 min-w-[120px]"
            value={dagName}
            onChange={e => setDagName(e.target.value)}
          />

          <button
            onClick={() => { loadList(); setShowDAGPanel(true); }}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-1"
            title="My DAGs"
          >
            ▾
          </button>

          <button
            onClick={() => saveDAG(nodesRef.current, edgesRef.current, dagName)}
            disabled={saving}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? '…' : '↑ Save'}
          </button>

          <div className="w-px h-4 bg-gray-200" />

          <button
            onClick={addNode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium transition-colors"
          >
            + Add Node
          </button>
          <button
            onClick={runAll}
            disabled={runningAll || nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
          >
            {runningAll ? '⏳ Running…' : '▶▶ Run All'}
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setShowSettings(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              llmConfigured
                ? 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            🤖 {llmConfigured ? `LLM: ${llmSettings.model}` : 'Configure LLM'}
          </button>

          {userEmail && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>
              <button
                onClick={handleSignOut}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </header>

        {/* Canvas */}
        <main className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }}
          >
            <Background color="#cbd5e1" gap={24} size={1} />
            <Controls />
            <MiniMap
              nodeColor={n => {
                const st = (n.data as NodeData)?.status;
                return st === 'success' ? '#34d399' : st === 'error' ? '#f87171' : st === 'running' ? '#60a5fa' : '#94a3b8';
              }}
              maskColor="rgba(248,250,252,0.7)"
            />
          </ReactFlow>
        </main>

        {showSettings && (
          <LLMSettingsPanel
            initial={llmSettings}
            onClose={() => setShowSettings(false)}
            onSave={saveLLMSettings}
          />
        )}

        {showDAGPanel && (
          <DAGPanel
            dags={dags}
            onLoad={handleLoadDAG}
            onNew={handleNewDAG}
            onClose={() => setShowDAGPanel(false)}
          />
        )}
      </div>
    </DAGContext.Provider>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <DAGEditor />
    </ReactFlowProvider>
  );
}
