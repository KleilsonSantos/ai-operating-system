#!/usr/bin/env bash
# Local smoke: pack create-agent (+ registry) and scaffold via the packed tarball.
# Does not require npm auth.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/aios-create-agent-pack.XXXXXX")"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

echo "==> Build"
pnpm --filter @aios/agent-registry build
pnpm --filter @aios/create-agent build

echo "==> Pack"
pnpm --filter @aios/agent-registry pack --pack-destination "$TMP" >/dev/null
pnpm --filter @aios/create-agent pack --pack-destination "$TMP" >/dev/null
REG_TGZ="$(ls -1 "$TMP"/aios-agent-registry-*.tgz | head -1)"
CREATE_TGZ="$(ls -1 "$TMP"/aios-create-agent-*.tgz | head -1)"
echo "registry: $REG_TGZ"
echo "create-agent: $CREATE_TGZ"

WORK="$TMP/work"
mkdir -p "$WORK"
cd "$WORK"
npm init -y >/dev/null
npm install "$REG_TGZ" "$CREATE_TGZ" --no-fund --no-audit

echo "==> Run create-agent bin"
npx create-agent --name pack-smoke --dir ./agent-pack-smoke

test -f ./agent-pack-smoke/agent.yaml
test -f ./agent-pack-smoke/src/index.ts

echo "OK: packed scaffolder produced agent-pack-smoke/"
