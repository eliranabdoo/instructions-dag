import type { Node, Edge } from 'reactflow';
import type { NodeData } from '@/types';

export function topologicalSort(nodes: Node<NodeData>[], edges: Edge[]): Node<NodeData>[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach(e => {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  });

  const queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0);
  const result: Node<NodeData>[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const neighborId of adj.get(node.id) ?? []) {
      const deg = (inDegree.get(neighborId) ?? 0) - 1;
      inDegree.set(neighborId, deg);
      if (deg === 0) {
        const neighbor = nodes.find(n => n.id === neighborId);
        if (neighbor) queue.push(neighbor);
      }
    }
  }

  return result;
}

export async function executeCode(
  code: string,
  inputs: Record<string, unknown>
): Promise<{ output: string | null; error: string | null }> {
  try {
    const logs: string[] = [];
    const fakeConsole = {
      log: (...args: unknown[]) =>
        logs.push(args.map(v => (typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v))).join(' ')),
      error: (...args: unknown[]) => logs.push('Error: ' + args.map(String).join(' ')),
      warn: (...args: unknown[]) => logs.push('Warn: ' + args.map(String).join(' ')),
      info: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
    };

    // eslint-disable-next-line no-new-func
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction('inputs', 'console', code);
    const result = await fn(inputs, fakeConsole);

    const output =
      result !== undefined
        ? typeof result === 'object'
          ? JSON.stringify(result, null, 2)
          : String(result)
        : logs.join('\n') || null;

    return { output, error: null };
  } catch (e) {
    return { output: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export function getNodeInputs(
  nodeId: string,
  nodes: Node<NodeData>[],
  edges: Edge[]
): Record<string, unknown> {
  const parentEdges = edges.filter(e => e.target === nodeId);
  const inputs: Record<string, unknown> = {};

  for (const edge of parentEdges) {
    const parent = nodes.find(n => n.id === edge.source);
    if (parent) {
      const raw = parent.data.output;
      try {
        inputs[parent.data.title] = raw ? JSON.parse(raw) : raw;
      } catch {
        inputs[parent.data.title] = raw;
      }
    }
  }

  return inputs;
}
