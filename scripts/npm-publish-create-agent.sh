#!/usr/bin/env bash
# Publish @aios-platform/agent-registry then @aios-platform/create-agent (order matters).
# Usage:
#   bash scripts/npm-publish-create-agent.sh --dry-run
#   bash scripts/npm-publish-create-agent.sh
#   bash scripts/npm-publish-create-agent.sh --otp=123456
#
# Auth precedence:
#   1. TOKEN_NPM in repo-root .env (GAT with Publish on @aios-platform; bypass-2FA avoids --otp)
#   2. Else ~/.npmrc from npm login — publish usually needs --otp=###### (2FA)
# Do not infer token health from npm login alone; see docs/guides/publish-create-agent.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DRY=()
OTP=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY=(--dry-run); shift ;;
    --otp=*) OTP=(--otp="${1#--otp=}"); shift ;;
    --otp) OTP=(--otp="$2"); shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -f "$ROOT/.env" ]]; then
  # Load TOKEN_NPM only (do not source whole .env — may contain invalid shell names)
  TOKEN_NPM="$(grep -E '^TOKEN_NPM=' "$ROOT/.env" | head -1 | cut -d= -f2- || true)"
fi

TMPRC=""
cleanup() {
  if [[ -n "${TMPRC}" && -f "${TMPRC}" ]]; then
    rm -f "${TMPRC}"
  fi
}
trap cleanup EXIT

if [[ -n "${TOKEN_NPM:-}" ]]; then
  TMPRC="$(mktemp)"
  printf '//registry.npmjs.org/:_authToken=%s\n' "$TOKEN_NPM" > "$TMPRC"
  export NPM_CONFIG_USERCONFIG="$TMPRC"
  echo "==> Using TOKEN_NPM from .env"
fi

echo "==> Building packages"
pnpm --filter @aios-platform/agent-registry build
pnpm --filter @aios-platform/create-agent build

echo "==> Publishing @aios-platform/agent-registry ${DRY[*]:-} ${OTP[*]:-}"
pnpm --filter @aios-platform/agent-registry publish --access public --no-git-checks "${DRY[@]}" "${OTP[@]}"

echo "==> Publishing @aios-platform/create-agent ${DRY[*]:-} ${OTP[*]:-}"
pnpm --filter @aios-platform/create-agent publish --access public --no-git-checks "${DRY[@]}" "${OTP[@]}"

echo "OK: npm create @aios-platform/agent@latest -- --name my-agent"
