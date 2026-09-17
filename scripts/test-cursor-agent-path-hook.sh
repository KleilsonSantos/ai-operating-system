#!/usr/bin/env bash
# Smoke: Cursor Agent PATH inject hook (#491).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="${ROOT}/.cursor/hooks/inject-agent-path.sh"

if [[ ! -f "$HOOK" ]]; then
  echo "FAIL: missing hook: ${HOOK}" >&2
  exit 1
fi

run_hook() { bash "$HOOK"; }

payload='{"tool_name":"Shell","tool_input":{"command":"which node"}}'
out="$(printf '%s' "$payload" | run_hook)"
echo "$out" | python3 -c '
import json, sys
o = json.load(sys.stdin)
assert o.get("permission") == "allow", o
cmd = (o.get("updated_input") or {}).get("command", "")
assert "AIOS_AGENT_PATH=1" in cmd, cmd
assert "which node" in cmd, cmd
print("OK: PATH inject rewrite")
'

# Idempotent: already injected → empty / no rewrite
payload2='{"tool_name":"Shell","tool_input":{"command":"export AIOS_AGENT_PATH=1 PATH=/usr/bin:$PATH; which node"}}'
out2="$(printf '%s' "$payload2" | run_hook)"
echo "$out2" | python3 -c '
import json, sys
o = json.load(sys.stdin)
assert o == {} or "updated_input" not in o, o
print("OK: skip when already injected")
'

# Empty stdin → soft allow
out3="$(printf '' | run_hook)"
echo "$out3" | python3 -c '
import json, sys
raw = sys.stdin.read().strip() or "{}"
o = json.loads(raw)
assert "permission" not in o or o.get("permission") == "allow"
print("OK: empty stdin")
'

echo "DONE"
