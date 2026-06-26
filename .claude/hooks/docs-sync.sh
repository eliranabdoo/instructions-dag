#!/bin/bash
# Fires after Edit/Write on src/ files.
# Outputs a targeted docs-sync reminder so Claude validates and updates docs in the same turn.

INPUT=$(cat)

FILE=$(echo "$INPUT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

# Only trigger for src/ changes
[[ "$FILE" != *"/src/"* ]] && exit 0

# Map file path to relevant docs
DOCS=""
if [[ "$FILE" == *"/app/api/"* ]]; then
  DOCS="docs/api.md"
elif [[ "$FILE" == *"/lib/dag-utils"* ]]; then
  DOCS="docs/architecture.md — execution model and data flow sections"
elif [[ "$FILE" == *"/lib/use-dags"* || "$FILE" == *"/lib/supabase"* ]]; then
  DOCS="docs/data-model.md, docs/architecture.md"
elif [[ "$FILE" == *"/proxy"* ]]; then
  DOCS="docs/architecture.md — auth routing section"
elif [[ "$FILE" == *"/types"* ]]; then
  DOCS="docs/data-model.md — NodeData shape section"
elif [[ "$FILE" == *"/components/"* || "$FILE" == *"/app/page"* || "$FILE" == *"/app/login"* ]]; then
  DOCS="docs/architecture.md (frontend), docs/stack.md"
else
  DOCS="docs/ — check index.md ownership map"
fi

echo "DOCS SYNC: $(basename "$FILE") changed → validate $DOCS. Update any section that no longer matches the code."
