'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import dynamic from 'next/dynamic';
import { useDAG } from '@/lib/dag-context';
import type { NodeData } from '@/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[160px] bg-[#1e1e1e] flex items-center justify-center text-gray-500 text-xs">
      Loading editor…
    </div>
  ),
});

const STATUS_RING: Record<string, string> = {
  idle: 'border-gray-200',
  running: 'border-blue-400',
  success: 'border-emerald-400',
  error: 'border-red-400',
};

const STATUS_DOT: Record<string, string> = {
  idle: 'bg-gray-300',
  running: 'bg-blue-400 animate-pulse',
  success: 'bg-emerald-400',
  error: 'bg-red-400',
};

const STATUS_HEADER: Record<string, string> = {
  idle: 'bg-gray-50',
  running: 'bg-blue-50',
  success: 'bg-emerald-50',
  error: 'bg-red-50',
};

function CodeNode({ id, data, selected }: NodeProps<NodeData>) {
  const { updateNode, runNode, rewriteNode, llmConfigured } = useDAG();
  const running = data.status === 'running';

  return (
    <div
      className={`w-[440px] rounded-xl border-2 ${STATUS_RING[data.status]} ${
        selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      } bg-white shadow-xl overflow-hidden`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className={`${STATUS_HEADER[data.status]} px-3 py-2 flex items-center gap-2 border-b border-gray-100`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[data.status]}`} />
        <input
          className="flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none nodrag"
          value={data.title}
          onChange={e => updateNode(id, { title: e.target.value })}
          onClick={e => e.stopPropagation()}
        />
        <button
          onClick={() => runNode(id)}
          disabled={running}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-xs font-medium transition-colors nodrag"
        >
          {running ? '⏳' : '▶'} {running ? 'Running…' : 'Run'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['code', 'instructions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => updateNode(id, { activeTab: tab })}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors nodrag ${
              data.activeTab === tab
                ? 'bg-white text-gray-800 border-b-2 border-blue-500'
                : 'bg-gray-50 text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab === 'code' ? '{ } Code' : '✨ Instructions'}
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div className="nodrag nopan">
        {data.activeTab === 'code' ? (
          <MonacoEditor
            height="160px"
            language="javascript"
            theme="vs-dark"
            value={data.code}
            onChange={val => updateNode(id, { code: val ?? '' })}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'off',
              folding: false,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 8 },
              renderLineHighlight: 'none',
            }}
          />
        ) : (
          <div className="relative">
            <textarea
              className="w-full h-[160px] p-3 text-sm bg-gray-50 text-gray-700 resize-none outline-none nodrag nopan placeholder-gray-400 font-mono"
              placeholder={
                "Describe what this node should do…\n\ne.g. \"Fetch data from an API and return the first 10 results\""
              }
              value={data.instructions}
              onChange={e => updateNode(id, { instructions: e.target.value })}
            />
            {llmConfigured ? (
              <button
                onClick={() => rewriteNode(id)}
                disabled={running || !data.instructions.trim()}
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium transition-colors nodrag"
              >
                ✨ Rewrite Code
              </button>
            ) : (
              <span className="absolute bottom-2 right-2 text-xs text-gray-400 nodrag">
                Configure LLM to enable
              </span>
            )}
          </div>
        )}
      </div>

      {/* Output */}
      {(data.output !== null || data.error !== null) && (
        <div
          className={`border-t px-3 py-2 ${
            data.error ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'
          }`}
        >
          <div className="text-xs font-medium text-gray-500 mb-1">
            {data.error ? '✗ Error' : '✓ Output'}
          </div>
          <pre className={`text-xs font-mono whitespace-pre-wrap max-h-[100px] overflow-auto ${
            data.error ? 'text-red-700' : 'text-gray-700'
          }`}>
            {data.error ?? data.output}
          </pre>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white"
      />
    </div>
  );
}

export default memo(CodeNode);
