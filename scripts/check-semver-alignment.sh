#!/usr/bin/env bash
# Gate anti-drift SemVer (#15).
# Falaha se houver commits *releaseable* após a última tag v* e package.json
# ainda estiver na mesma versão da tag (main à frente sem bump).
# Se package.json > tag, exige seção ## [X.Y.Z] no CHANGELOG.
#
# Uso:
#   bash scripts/check-semver-alignment.sh
#   bash scripts/check-semver-alignment.sh origin/main HEAD

set -euo pipefail

BASE_REF="${1:-}"
HEAD_REF="${2:-HEAD}"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [[ ! -f package.json ]]; then
  echo "semver-align: package.json ausente — skip"
  exit 0
fi

PKG_VERSION="$(python3 -c "import json; print(json.load(open('package.json'))['version'])")"

# Última tag anotada/leve no formato vX.Y.Z
LAST_TAG="$(git tag -l 'v*.*.*' --sort=-v:refname | head -n 1 || true)"
if [[ -z "$LAST_TAG" ]]; then
  echo "semver-align: nenhuma tag v* — skip (bootstrap)"
  exit 0
fi

TAG_VERSION="${LAST_TAG#v}"

echo "semver-align: package.json=$PKG_VERSION  last_tag=$LAST_TAG"

version_gt() {
  # true se $1 > $2 (SemVer simples X.Y.Z)
  python3 - "$1" "$2" <<'PY'
import sys
def parse(v):
    return tuple(int(x) for x in v.split(".")[:3])
a, b = parse(sys.argv[1]), parse(sys.argv[2])
sys.exit(0 if a > b else 1)
PY
}

version_eq() {
  [[ "$1" == "$2" ]]
}

# Commits após a tag até HEAD (ou range base...head se informado)
if [[ -n "$BASE_REF" ]]; then
  RANGE="${LAST_TAG}..${HEAD_REF}"
else
  RANGE="${LAST_TAG}..${HEAD_REF}"
fi

if ! git rev-parse --verify "$LAST_TAG" >/dev/null 2>&1; then
  echo "semver-align: tag $LAST_TAG inválida"
  exit 1
fi

MAPFILE=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  MAPFILE+=("$line")
done < <(git log --format='%s' "$RANGE" 2>/dev/null || true)

if [[ ${#MAPFILE[@]} -eq 0 ]]; then
  echo "semver-align: nenhum commit após $LAST_TAG — OK"
  exit 0
fi

RELEASEABLE=0
for subject in "${MAPFILE[@]}"; do
  # merges e chore/docs/ci/test/style puros não forçam bump sozinhos
  if [[ "$subject" =~ ^merge:\  ]]; then
    continue
  fi
  if [[ "$subject" =~ ^(chore|docs|ci|test|style|build):\  ]]; then
    continue
  fi
  # feat, fix, perf, refactor, release, ui → releaseable
  if [[ "$subject" =~ ^(feat|fix|perf|refactor|release|ui):\  ]]; then
    RELEASEABLE=1
    echo "semver-align: releaseable → $subject"
  fi
done

if [[ "$RELEASEABLE" -eq 0 ]]; then
  echo "semver-align: só commits não-releaseable após $LAST_TAG — OK"
  exit 0
fi

if version_eq "$PKG_VERSION" "$TAG_VERSION"; then
  echo "semver-align: FAIL — há mudanças releaseable após $LAST_TAG," >&2
  echo "  mas package.json ainda está em $PKG_VERSION." >&2
  echo "  Faça bump SemVer + CHANGELOG [X.Y.Z] (+ tag após merge em main)." >&2
  echo "  Ver issue #15 e docs/guides/releases.md" >&2
  exit 1
fi

if ! version_gt "$PKG_VERSION" "$TAG_VERSION"; then
  echo "semver-align: FAIL — package.json ($PKG_VERSION) não é > $TAG_VERSION" >&2
  exit 1
fi

if ! grep -qE "^## \[${PKG_VERSION}\]" CHANGELOG.md; then
  echo "semver-align: FAIL — CHANGELOG sem seção ## [${PKG_VERSION}]" >&2
  exit 1
fi

echo "semver-align: OK — $PKG_VERSION > $TAG_VERSION e CHANGELOG alinhado"
exit 0
