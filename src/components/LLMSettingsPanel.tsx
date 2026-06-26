'use client';

import { useState } from 'react';
import type { LLMSettings } from '@/types';

interface Props {
  initial: LLMSettings;
  onClose: () => void;
  onSave: (settings: LLMSettings) => void;
}

export default function LLMSettingsPanel({ initial, onClose, onSave }: Props) {
  const [s, setS] = useState(initial);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-[440px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">🤖 LLM Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-5">
          Connect any OpenAI-compatible API. The key is stored locally in your browser only.
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-gray-600">API Key</span>
            <input
              type="password"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
              placeholder="sk-…"
              value={s.apiKey}
              onChange={e => setS(prev => ({ ...prev, apiKey: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">Base URL</span>
            <input
              type="text"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
              placeholder="https://api.openai.com/v1"
              value={s.baseUrl}
              onChange={e => setS(prev => ({ ...prev, baseUrl: e.target.value }))}
            />
            <span className="text-xs text-gray-400">Leave blank for OpenAI default</span>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">Model</span>
            <input
              type="text"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
              placeholder="gpt-4o"
              value={s.model}
              onChange={e => setS(prev => ({ ...prev, model: e.target.value }))}
            />
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(s); onClose(); }}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
