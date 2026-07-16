#!/usr/bin/env bash
# Merge PR com subject canónico: merge: 🔀 PR #<n> — <branch>
# Uso: bash scripts/merge-pr.sh <pr-number> [--delete-branch] [outros args gh]
# Nunca omitir o subject — evita "Merge pull request #N from …"
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: bash scripts/merge-pr.sh <pr-number> [args extras do gh pr merge]" >&2
  exit 2
fi

PR="$1"
shift

if ! [[ "$PR" =~ ^[0-9]+$ ]]; then
  echo "PR number inválido: $PR" >&2
  exit 2
fi

META=$(gh pr view "$PR" --json number,headRefName,baseRefName,state,title)
STATE=$(printf '%s' "$META" | python3 -c 'import json,sys; print(json.load(sys.stdin)["state"])')
HEAD=$(printf '%s' "$META" | python3 -c 'import json,sys; print(json.load(sys.stdin)["headRefName"])')
BASE=$(printf '%s' "$META" | python3 -c 'import json,sys; print(json.load(sys.stdin)["baseRefName"])')

if [[ "$STATE" != "OPEN" ]]; then
  echo "PR #$PR não está OPEN (state=$STATE)" >&2
  exit 1
fi

SUBJECT="merge: 🔀 PR #${PR} — ${HEAD}"

echo "Merging PR #${PR} (${HEAD} → ${BASE})"
echo "Subject: ${SUBJECT}"

# Prefer --subject (gh recente); fallback -t
if gh pr merge --help 2>&1 | grep -q -- '--subject'; then
  gh pr merge "$PR" --merge --subject "$SUBJECT" "$@"
else
  gh pr merge "$PR" --merge -t "$SUBJECT" "$@"
fi

echo "OK: $SUBJECT"
