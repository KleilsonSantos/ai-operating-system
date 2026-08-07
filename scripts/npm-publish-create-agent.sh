#!/usr/bin/env bash
# Publish @aios/agent-registry then @aios/create-agent (order matters for workspace deps).
# Usage:
#   bash scripts/npm-publish-create-agent.sh --dry-run
#   bash scripts/npm-publish-create-agent.sh
#
# Requires: npm login with publish rights on the @aios org; pnpm; Node >= 22.13
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DRY=()
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY=(--dry-run)
  shift
fi

echo "==> Building packages"
pnpm --filter @aios/agent-registry build
pnpm --filter @aios/create-agent build

echo "==> Publishing @aios/agent-registry ${DRY[*]:-}"
pnpm --filter @aios/agent-registry publish --access public --no-git-checks "${DRY[@]}"

echo "==> Publishing @aios/create-agent ${DRY[*]:-}"
pnpm --filter @aios/create-agent publish --access public --no-git-checks "${DRY[@]}"

echo "OK: npm create @aios/agent@latest -- --name my-agent"
