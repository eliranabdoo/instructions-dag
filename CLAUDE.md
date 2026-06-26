# instructions-dag

## Session Start

Load `docs/index.md` immediately. Follow links to relevant docs before touching code.

## AI-Native Development Contract

This repo treats docs and code as a single source of truth. They must never contradict each other.

**Invariant:** Every concept described in `docs/` must accurately reflect the current code, and every non-trivial code decision must be documented somewhere in `docs/`.

### Rules

1. **Before changing code** — check if any doc describes the behavior you're about to change. Read it.
2. **After changing code** — the PostToolUse hook will fire and tell you which docs to validate. Do it in the same turn, not later.
3. **Before ending a session** — if anything in `docs/` no longer matches the code, update the doc. Do not leave contradictions.
4. **New concepts** — if you introduce something not covered in any doc (new table, new route, new execution model), add it to the right doc before the session ends.

### Doc Ownership Map

| What changed | Docs to check |
|---|---|
| `src/app/api/**` | `docs/api.md` |
| `src/lib/dag-utils.ts` | `docs/architecture.md` (execution model, data flow) |
| `src/lib/use-dags.ts`, `src/lib/supabase.ts` | `docs/data-model.md`, `docs/architecture.md` |
| `src/proxy.ts` | `docs/architecture.md` (auth routing) |
| `src/components/**`, `src/app/page.tsx` | `docs/architecture.md` (frontend), `docs/stack.md` |
| `src/types.ts` | `docs/data-model.md` |
| Supabase schema | `docs/data-model.md`, `supabase-migration.sql` |
| New dependency in `package.json` | `docs/stack.md` |

### What "validate" means

Read the relevant doc section. Ask: does it still accurately describe the code? If not, rewrite the section. Do not add stale notes — delete outdated content and replace it.
