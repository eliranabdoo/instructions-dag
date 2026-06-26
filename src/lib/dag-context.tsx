'use client';

import { createContext, useContext } from 'react';
import type { NodeData } from '@/types';

export interface DAGContextValue {
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  runNode: (id: string) => Promise<void>;
  rewriteNode: (id: string) => Promise<void>;
  llmConfigured: boolean;
}

export const DAGContext = createContext<DAGContextValue>({
  updateNode: () => {},
  runNode: async () => {},
  rewriteNode: async () => {},
  llmConfigured: false,
});

export const useDAG = () => useContext(DAGContext);
