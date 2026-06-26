'use client';

import type { DAGRecord } from '@/lib/use-dags';

interface Props {
  dags: DAGRecord[];
  onLoad: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}

export default function DAGPanel({ dags, onLoad, onNew, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">My DAGs</h2>
          <button onClick={onNew} className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-white font-medium transition-colors">
            + New
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {dags.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No saved DAGs yet</p>
          ) : (
            dags.map(dag => (
              <button
                key={dag.id}
                onClick={() => onLoad(dag.id)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
              >
                <span className="text-sm font-medium text-gray-800">{dag.name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(dag.updated_at).toLocaleDateString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
