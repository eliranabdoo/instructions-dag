---
type: API
title: API Routes
description: Next.js API routes reference for instructions-dag v1.
tags: [api, routes, nextjs]
timestamp: 2026-06-26T00:00:00Z
---

# API Routes

One server-side API route in v1. DAG CRUD is handled client-side via `@supabase/ssr` directly (no API route needed — RLS enforces ownership). Code execution runs in the browser.

## LLM

### `POST /api/rewrite`

Proxies LLM requests server-side so the API key doesn't appear in browser network traffic from the client origin.

**Request body:**
```json
{
  "instructions": "string — plain English description of what the node should do",
  "code": "string — existing code (optional, for rewrite context)",
  "apiKey": "string — user's LLM API key",
  "baseUrl": "string — OpenAI-compatible base URL (empty = OpenAI default)",
  "model": "string — model name, e.g. gpt-4o"
}
```

**Response:**
```json
{ "code": "string — generated JavaScript, no markdown fences" }
```

**Error response:**
```json
{ "error": "string" }
```

Status 400 if `apiKey` missing. Status 500 on LLM error.

**System prompt context:** Code runs inside `async function(inputs, console)`. LLM is instructed to use `return value` for output or `console.log()`, and to return raw JS only.

**File:** `src/app/api/rewrite/route.ts`
