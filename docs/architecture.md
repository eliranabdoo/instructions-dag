---
type: Guide
title: Architecture
description: System components, data flow, and deployment topology for instructions-dag v1.
tags: [architecture, deployment, overview]
timestamp: 2026-06-26T00:00:00Z
---

# Architecture

## Topology

```
Browser → Vercel (Next.js 16) ↔ Supabase (Postgres + Auth)
              ↓
        LLM Provider API (OpenAI-compatible, user-supplied key)
```

## Components

**Vercel — Next.js 16 App Router**
Frontend + API routes. Handles UI, auth session routing (`src/proxy.ts`), DAG persistence, and LLM rewrite proxying. No server-side compute for code execution in v1.

**Supabase**
- Postgres: single `dags` table storing nodes + edges as JSONB blobs per user
- Auth: email/password via `@supabase/ssr`, session cookies managed by `src/proxy.ts`

**Browser (execution runtime)**
Code cells execute client-side via `new AsyncFunction(code)`. Topological sort runs in the browser. Each node gets `inputs` (outputs of parent nodes keyed by title) and a fake `console`. No sandbox — cells run in the user's own browser tab.

**LLM Provider (optional)**
User brings their own API key + base URL (any OpenAI-compatible endpoint). Key stored in `localStorage`, proxied through `/api/rewrite` server-side so it never touches Vercel logs on the client.

## Key Design Decision: Browser Execution

v1 runs JS code in the browser rather than a server-side executor. Trade-offs:
- ✓ Zero infra, instant execution, no cold starts
- ✓ Full browser API access (`fetch`, DOM, etc.)
- ✗ JavaScript only (no Python, shell, etc.)
- ✗ No isolation between cells or users (single browser tab)

Server-side execution (Airflow or sandboxed subprocess) is planned for v2. See [Roadmap](roadmap.md).

## Data Flow — DAG Run

1. User clicks "Run Node" or "Run All"
2. Browser topologically sorts nodes (`src/lib/dag-utils.ts → topologicalSort`)
3. For each node: gather `inputs` from parent node outputs, call `executeCode(node.code, inputs)`
4. `executeCode` wraps code in `AsyncFunction`, captures `return` value or `console.log` output
5. Node status + output updated in React state; no persistence of run results

## Data Flow — LLM Rewrite

1. User writes natural language in the Instructions tab, clicks "Rewrite Code"
2. Browser POSTs to `/api/rewrite` with `{ instructions, code, apiKey, baseUrl, model }`
3. API route calls the LLM provider, returns raw code string
4. Node switches to Code tab, code replaced with LLM output
