#!/usr/bin/env bash
# Local smoke: pack agent-template + create-agent (+ registry) and scaffold via packed tarballs.
# Does not require npm auth.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/aios-create-agent-pack.XXXXXX")"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

echo "==> Build"
pnpm --filter @aios-platform/agent-registry build
pnpm --filter @aios-platform/agent-template build
pnpm --filter @aios-platform/create-agent build

echo "==> Pack"
pnpm --filter @aios-platform/agent-registry pack --pack-destination "$TMP" >/dev/null
pnpm --filter @aios-platform/agent-template pack --pack-destination "$TMP" >/dev/null
pnpm --filter @aios-platform/create-agent pack --pack-destination "$TMP" >/dev/null
REG_TGZ="$(ls -1 "$TMP"/aios-platform-agent-registry-*.tgz | head -1)"
TMPL_TGZ="$(ls -1 "$TMP"/aios-platform-agent-template-*.tgz | head -1)"
CREATE_TGZ="$(ls -1 "$TMP"/aios-platform-create-agent-*.tgz | head -1)"
echo "registry: $REG_TGZ"
echo "agent-template: $TMPL_TGZ"
echo "create-agent: $CREATE_TGZ"

WORK="$TMP/work"
mkdir -p "$WORK"
cd "$WORK"
npm init -y >/dev/null
npm install "$REG_TGZ" "$TMPL_TGZ" "$CREATE_TGZ" --no-fund --no-audit

echo "==> Run create-agent bin"
npx create-agent --name pack-smoke --dir ./agent-pack-smoke

test -f ./agent-pack-smoke/agent.yaml
test -f ./agent-pack-smoke/src/index.ts

echo "OK: packed scaffolder produced agent-pack-smoke/"
