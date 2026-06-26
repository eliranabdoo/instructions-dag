---
type: Guide
title: Stack
description: Technology choices and rationale for instructions-dag v1.
tags: [stack, libraries, dependencies]
timestamp: 2026-06-26T00:00:00Z
---

# Stack

## Frontend

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | API routes + SSR in one deploy; Vercel-native |
| Styling | Tailwind CSS v4 | Utility-first, no runtime overhead |
| DAG canvas | `reactflow` v11 | Purpose-built for node graphs; handles, zoom, minimap |
| Code editor | `@monaco-editor/react` | VS Code engine; lazy-loaded; dark theme inside ReactFlow nodes |

## Backend / Data

| Layer | Choice | Why |
|-------|--------|-----|
| Auth + DB | Supabase | Postgres + auth in one; free tier; native Vercel integration |
| DB client | `@supabase/ssr` | SSR-safe session cookies for Next.js App Router |
| Auth routing | `src/proxy.ts` (Next.js proxy) | Redirects unauthenticated requests to `/login` server-side |
| DAG storage | Single `dags` table with JSONB `nodes`/`edges` | Simple; avoids join complexity for MVP; easy to evolve |

## Execution

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Browser (`new AsyncFunction`) | Zero infra; instant; sufficient for JS-only v1 |
| Topological sort | Custom BFS in `src/lib/dag-utils.ts` | No library needed; Kahn's algorithm, ~30 lines |
| Inter-node data | `inputs` object keyed by parent node title | Simple; readable in code cells |

## LLM

| Layer | Choice | Why |
|-------|--------|-----|
| SDK | `openai` npm package (v6) | OpenAI-compatible with any provider via `baseURL` override |
| Key storage | `localStorage` (browser) | User-owned key; never hits Vercel logs; proxied through `/api/rewrite` |

## Deployment

| Layer | Choice | Why |
|-------|--------|-----|
| Hosting | Vercel | Zero-config Next.js; automatic preview deploys |
| Database | Supabase (project `nyuwdjytswmigfdkqhus`, region `us-east-1`) | Managed Postgres + auth |
