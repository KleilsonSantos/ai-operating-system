#!/usr/bin/env bash
# Publica docs/wiki/Home.md → GitHub Wiki (mapa de links).
# Bootstrap da 1ª página (se remoto ainda não existir):
#   python3 scripts/bootstrap-wiki-chrome.py
#   (Chrome logado no GitHub + Ver → Programador → JS dos Eventos da Apple)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/docs/wiki/Home.md"
[[ -f "$SRC" ]] || { echo "Missing $SRC"; exit 1; }

WIKI_DIR=$(mktemp -d)
trap 'rm -rf "$WIKI_DIR"' EXIT
cp "$SRC" "$WIKI_DIR/Home.md"
cd "$WIKI_DIR"
git init -b master >/dev/null
git add Home.md
git -c user.name="${GIT_AUTHOR_NAME:-Kleilson Santos}" \
    -c user.email="${GIT_AUTHOR_EMAIL:-kdsddesign1@gmail.com}" \
    commit -m "docs: 📋 sync Wiki Home from docs/wiki/Home.md" >/dev/null
git remote add origin https://github.com/KleilsonSantos/ai-operating-system.wiki.git
if ! git push -u origin master --force; then
  echo ""
  echo "Wiki remota ainda vazia (GitHub 404 até existir 1 página)."
  echo "Abre: https://github.com/KleilsonSantos/ai-operating-system/wiki"
  echo "Clica \"Create the first page\" → Save → re-executa: bash scripts/publish-wiki.sh"
  exit 1
fi
echo "Wiki OK → https://github.com/KleilsonSantos/ai-operating-system/wiki"
