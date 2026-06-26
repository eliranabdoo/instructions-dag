---
type: Table
title: Data Model
description: Supabase Postgres schema for instructions-dag v1.
tags: [database, schema, supabase, postgres]
timestamp: 2026-06-26T00:00:00Z
---

# Data Model

Supabase manages `auth.users`. One app table in `public` schema with RLS enabled.

## Tables

### `dags`
Stores complete DAG state as JSONB. Nodes and edges are embedded rather than normalized — simpler for v1, easy to query for the load/save pattern.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, `gen_random_uuid()` |
| user_id | uuid | FK → `auth.users.id` |
| name | text | Display name, editable in toolbar |
| nodes | jsonb | Array of ReactFlow `Node<NodeData>` objects (position, code, instructions, title, status stripped to `idle` on save) |
| edges | jsonb | Array of ReactFlow `Edge` objects (source, target, style) |
| created_at | timestamptz | `now()` |
| updated_at | timestamptz | Set on every save |

### `NodeData` shape (embedded in `nodes` JSONB)

```ts
{
  title: string           // editable node label
  code: string            // JavaScript source
  instructions: string    // plain-English description for LLM rewriting
  output: null            // always null on save (ephemeral)
  error: null             // always null on save (ephemeral)
  status: 'idle'          // always reset to idle on save
  activeTab: 'code' | 'instructions'
}
```

## RLS Policies

All four operations scoped to owner:

```sql
-- SELECT / INSERT / UPDATE / DELETE
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)  -- UPDATE/INSERT
```

## LLM Settings

Not stored in the database. Saved in browser `localStorage` under key `dag-llm-settings`:
```json
{ "apiKey": "sk-...", "baseUrl": "", "model": "gpt-4o" }
```

API key is passed server-side through `/api/rewrite` per request and never persisted.
