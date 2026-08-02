#!/usr/bin/env bash
# Install ~/.cursor/sandbox.json from this repo (api.github.com allowlist for Cursor agent gh).
# Usage: bash scripts/install-cursor-sandbox-allowlist.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/.cursor/sandbox.json"
DEST="${HOME}/.cursor/sandbox.json"

if [[ ! -f "$SRC" ]]; then
  echo "Missing ${SRC} — checkout AIOS with .cursor/sandbox.json present." >&2
  exit 1
fi

mkdir -p "${HOME}/.cursor"
cp "$SRC" "$DEST"
chmod 644 "$DEST"
echo "Wrote ${DEST}:"
cat "$DEST"
diff -u "$SRC" "$DEST" && echo MATCH
echo DONE
echo
echo "In Cursor: Settings → Agents → Auto Run → Auto-Run Network Access → sandbox.json + Defaults"
