---
type: Guide
title: Roadmap
description: v1 status and v2 plans for instructions-dag.
tags: [roadmap, planning, phases]
timestamp: 2026-06-26T00:00:00Z
---

# Roadmap

## v1 — Shipped (2026-06-26)

| Feature | Status | Notes |
|---------|--------|-------|
| Next.js 16 scaffold | ✓ | App Router, Tailwind v4, TypeScript |
| Auth (email/password) | ✓ | Supabase, `src/proxy.ts` redirects |
| DAG editor | ✓ | ReactFlow, drag-to-connect, minimap |
| Monaco code cells | ✓ | JS, dark theme, lazy-loaded |
| Browser execution | ✓ | `AsyncFunction`, topological sort, `inputs` propagation |
| LLM rewrite panel | ✓ | Instructions tab → `/api/rewrite` → code replaced |
| DAG persistence | ✓ | Save/load from Supabase `dags` table (JSONB) |
| Vercel deploy | ✓ | https://instructions-dag.vercel.app |

## v2 — Planned

### Server-side execution
Replace browser `AsyncFunction` with a real execution backend. Options:
- **Sandboxed subprocess**: Next.js API route spawns isolated Node/Python process per run
- **Airflow**: Oracle Cloud free-tier ARM, `dynamic_runner.py` template DAG, REST API trigger from Vercel
- **Vercel Sandbox**: Vercel's new serverless code execution (no infra management)

Airflow enables Python cells, retries, scheduling, and run history. See legacy `docs/airflow.md` for design notes.

### Other v2 items
- Run history — persist node outputs + status to DB per run
- Python support — requires server-side execution
- File uploads — attach CSV/JSON as data sources to nodes (Supabase Storage)
- DAG scheduling — cron triggers
- Shared DAGs — read-only share link

## Known v1 Limitations

- JS only — no Python, shell, or system calls
- No run history — outputs lost on page refresh
- No isolation — cells share the browser tab's JS heap
- LLM key in localStorage — cleared on browser data wipe
