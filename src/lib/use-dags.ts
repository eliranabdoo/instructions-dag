'use client';

import { useState, useCallback } from 'react';
import { createClient } from './supabase';
import type { Node, Edge } from 'reactflow';
import type { NodeData } from '@/types';

export interface DAGRecord {
  id: string;
  name: string;
  updated_at: string;
}

export function useDAGs() {
  const [saving, setSaving] = useState(false);
  const [dagId, setDagId] = useState<string | null>(null);
  const [dagName, setDagName] = useState('Untitled DAG');
  const [dags, setDags] = useState<DAGRecord[]>([]);

  const supabase = createClient();

  const loadList = useCallback(async () => {
    const { data } = await supabase
      .from('dags')
      .select('id, name, updated_at')
      .order('updated_at', { ascending: false });
    setDags(data ?? []);
    return data ?? [];
  }, [supabase]);

  const loadDAG = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('dags')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    setDagId(data.id);
    setDagName(data.name);
    return { nodes: data.nodes as Node<NodeData>[], edges: data.edges as Edge[] };
  }, [supabase]);

  const saveDAG = useCallback(async (
    nodes: Node<NodeData>[],
    edges: Edge[],
    name = dagName,
    id = dagId,
  ) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      name,
      nodes: nodes.map(n => ({
        ...n,
        data: { ...n.data, output: null, error: null, status: 'idle' },
      })),
      edges,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      await supabase.from('dags').update(payload).eq('id', id);
    } else {
      const { data } = await supabase.from('dags').insert(payload).select('id').single();
      if (data) setDagId(data.id);
    }

    setSaving(false);
  }, [supabase, dagId, dagName]);

  const newDAG = useCallback(() => {
    setDagId(null);
    setDagName('Untitled DAG');
  }, []);

  return { saving, dagId, dagName, setDagName, dags, loadList, loadDAG, saveDAG, newDAG };
}
