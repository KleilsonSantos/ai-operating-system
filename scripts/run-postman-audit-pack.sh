#!/usr/bin/env bash
# HTTP live-proof pack for audits / smoke (Postman CLI only — not Newman).
#
# Official runner: https://learning.postman.com/docs/postman-cli/postman-cli-run-collection.md
# Runtime gate: docs/guides/local-runtime-authorization.md (steps 5–6 / ok infra)
#
# Does NOT replace unit tests or integrations/evals/. HTTP surfaces only.
#
# Usage:
#   bash scripts/run-postman-audit-pack.sh
#   bash scripts/run-postman-audit-pack.sh --with-mcp
#   POSTMAN_ENV=integrations/postman/environments/aios.test.postman_environment.json \
#     bash scripts/run-postman-audit-pack.sh
#
# Prerequisites:
#   - `postman` CLI on PATH (https://learning.postman.com/docs/postman-cli/postman-cli-overview/)
#   - Console API listening (default http://127.0.0.1:8787)
#   - With --with-mcp: MCP Streamable HTTP on http://127.0.0.1:8791

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$ROOT"

WITH_MCP=0
for arg in "$@"; do
  case "$arg" in
    --with-mcp) WITH_MCP=1 ;;
    -h|--help)
      sed -n '1,25p' "$0"
      exit 0
      ;;
    *)
      echo "run-postman-audit-pack: unknown arg: $arg" >&2
      exit 2
      ;;
  esac
done

ENV_FILE="${POSTMAN_ENV:-integrations/postman/environments/aios.local.postman_environment.json}"
COLLECTIONS_DIR="integrations/postman/collections"

if ! command -v postman >/dev/null 2>&1; then
  echo "run-postman-audit-pack: \`postman\` CLI not found on PATH." >&2
  echo "  Install: https://learning.postman.com/docs/postman-cli/postman-cli-overview/" >&2
  echo "  Do not use Newman (Postman recommends Postman CLI; Newman is not maintained for v3)." >&2
  exit 127
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "run-postman-audit-pack: missing environment file: $ENV_FILE" >&2
  exit 1
fi

# Prefer loopback Console before spending time on collections.
CONSOLE_URL="${AIOS_CONSOLE_URL:-http://127.0.0.1:8787}"
if ! curl -fsS --max-time 2 "${CONSOLE_URL}/api/health" >/dev/null; then
  echo "run-postman-audit-pack: Console not reachable at ${CONSOLE_URL}/api/health" >&2
  echo "  Start: export AIOS_HOME=\"\$PWD\" && pnpm --filter @aios/console api" >&2
  echo "  Infra gate: docs/guides/local-runtime-authorization.md (ok infra)" >&2
  exit 1
fi

if [[ "$WITH_MCP" -eq 1 ]]; then
  MCP_URL="${AIOS_MCP_HTTP_URL:-http://127.0.0.1:8791}"
  if ! curl -fsS --max-time 2 "${MCP_URL}/health" >/dev/null; then
    echo "run-postman-audit-pack: MCP HTTP not reachable at ${MCP_URL}/health (--with-mcp)" >&2
    echo "  Start: export AIOS_HOME=\"\$PWD\" && pnpm --filter @aios/mcp dev:http" >&2
    exit 1
  fi
fi

run_one() {
  local file="$1"
  echo ""
  echo "==> postman collection run: $(basename "$file")"
  postman collection run "$file" --environment "$ENV_FILE"
}

# Audit pack order: cheapest proof first, then contracts, then chaining.
run_one "${COLLECTIONS_DIR}/AIOS - Smoke Tests.postman_collection.json"
run_one "${COLLECTIONS_DIR}/AIOS - Negative Tests.postman_collection.json"
run_one "${COLLECTIONS_DIR}/AIOS - Workflows.postman_collection.json"

if [[ "$WITH_MCP" -eq 1 ]]; then
  run_one "${COLLECTIONS_DIR}/AIOS - MCP HTTP.postman_collection.json"
else
  echo ""
  echo "run-postman-audit-pack: skipped MCP HTTP (pass --with-mcp when opt-in server is up)"
fi

echo ""
echo "run-postman-audit-pack: OK"
