#!/usr/bin/env bash
# Falha se o tip do branch usar o subject default do GitHub.
# Fecha o buraco: commitlint do PR não vê o merge commit criado no merge.
# Default: só HEAD (não pune merges antigos já no histórico).
set -euo pipefail

LIMIT="${1:-1}"
fail=0

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  hash="${line%% *}"
  subject="${line#* }"
  if [[ "$subject" =~ ^Merge\ pull\ request ]]; then
    echo "FAIL $hash  $subject"
    fail=1
  fi
done < <(git log --pretty=format:'%h %s' -n "$LIMIT")

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "Subject default do GitHub proibido no tip."
  echo "Use: bash scripts/merge-pr.sh <n>   →   merge: 🔀 PR #<n> — <branch>"
  echo "Ou:  gh pr merge <n> --merge --subject \"merge: 🔀 PR #<n> — <branch>\""
  exit 1
fi

echo "merge-tip: OK (últimos ${LIMIT} commit(s) sem 'Merge pull request')"
