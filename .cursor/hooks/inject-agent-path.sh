#!/usr/bin/env bash
# Inject a minimal toolchain PATH for Cursor Agent Shell (no login .zshrc).
# Refs #491 — mitigates `command not found: node` when nvm is only on interactive PATH.
#
# Contract: https://cursor.com/docs/hooks
# stdin  → preToolUse JSON with tool_input.command
# stdout → { permission, updated_input }
set -euo pipefail

input=$(cat)

# Prefer python3 for JSON (jq may be missing in the hook environment).
# shellcheck disable=SC2016
printf '%s' "$input" | python3 -c '
import json, os, sys

raw = sys.stdin.read()
try:
    data = json.loads(raw) if raw.strip() else {}
except json.JSONDecodeError:
    print("{}")
    raise SystemExit(0)

tool_input = data.get("tool_input") or {}
if not isinstance(tool_input, dict):
    tool_input = {}
cmd = tool_input.get("command")
if not isinstance(cmd, str) or not cmd.strip():
    print("{}")
    raise SystemExit(0)

marker = "AIOS_AGENT_PATH=1"
if marker in cmd:
    print("{}")
    raise SystemExit(0)

home = os.path.expanduser("~")
candidates = [
    "/usr/local/bin",
    "/opt/homebrew/bin",
    os.path.join(home, ".local", "bin"),
]
nvm_root = os.path.join(home, ".nvm", "versions", "node")
if os.path.isdir(nvm_root):
    versions = sorted(
        (d for d in os.listdir(nvm_root) if d.startswith("v")),
        key=lambda v: [int(x) if x.isdigit() else 0 for x in v.lstrip("v").split(".")],
    )
    if versions:
        candidates.insert(0, os.path.join(nvm_root, versions[-1], "bin"))

path_prefix = ":".join(p for p in candidates if p and os.path.isdir(p))
if not path_prefix:
    print("{}")
    raise SystemExit(0)

prefix = f"export {marker} PATH=\"{path_prefix}:$PATH\"; "
updated = dict(tool_input)
updated["command"] = prefix + cmd
print(json.dumps({"permission": "allow", "updated_input": updated}))
'
