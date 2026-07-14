#!/usr/bin/env bash
# Falha se commits do range tiverem subject sem gitmoji (CI).
set -euo pipefail

BASE_REF="${1:-origin/sandbox}"
HEAD_REF="${2:-HEAD}"

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "commit-lint: base $BASE_REF não encontrada; skip"
  exit 0
fi

fail=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  hash="${line%% *}"
  subject="${line#* }"
  if [[ "$subject" =~ ^merge:\ 🔀 ]]; then
    continue
  fi
  if [[ "$subject" =~ ^Merge\ pull\ request ]]; then
    echo "FAIL $hash  $subject"
    fail=1
    continue
  fi
  if ! python3 -c '
import re, sys
s = sys.argv[1]
# ui = alias legítimo de mudanças visuais (espelha Conventional "style")
# release = preparo SemVer anotado (docs/guides/releases.md)
m = re.match(
    r"^(feat|fix|docs|chore|ci|refactor|test|style|ui|perf|build|merge|release):\s+(\S+)\s+.+",
    s,
)
if not m:
    sys.exit(1)
emoji = m.group(2)
sys.exit(0 if not (emoji.isascii() and emoji.isalnum()) else 1)
' "$subject"; then
    echo "FAIL $hash  $subject"
    fail=1
  fi
done < <(git log --pretty=format:'%h %s' "${BASE_REF}..${HEAD_REF}")

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "Commits devem seguir: type: <gitmoji> descrição"
  echo "Merges: merge: 🔀 PR #<n> — <branch>"
  exit 1
fi

echo "commit-lint: OK"
