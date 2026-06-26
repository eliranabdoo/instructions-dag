export type NodeStatus = 'idle' | 'running' | 'success' | 'error';
export type NodeTab = 'code' | 'instructions';

export interface NodeData {
  title: string;
  code: string;
  instructions: string;
  output: string | null;
  error: string | null;
  status: NodeStatus;
  activeTab: NodeTab;
}

export interface LLMSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}
