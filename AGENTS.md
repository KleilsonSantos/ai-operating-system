# AGENTS.md — AI Operating System

Contrato para qualquer agente de IA neste repositório.

## Missão

Construir o **AIOS**: plataforma de governança para IA no SDLC — produto único, não um dump de prompts.

## Fontes de verdade

1. Código em `engines/` · `packages/` · `apps/`
2. `docs/FOUNDATION.md` (pedra base) · `docs/VISION.md` · `docs/architecture/` · ADRs
3. `docs/ROADMAP.md` · `CHANGELOG.md`

Em conflito entre resumo e `FOUNDATION.md`, a pedra base vence até ADR explícita.

**Wiki GitHub:** só mapa de links (não fonte canônica).

## Regras

1. AIOS é produto standalone (ADR-0001).
2. Fluxo Git: Issue → `feature/*` from `sandbox` → PR → `sandbox` → PR → `main`.
3. Commits: `type: <gitmoji> …` · autoria `Kleilson Santos <kdsddesign1@gmail.com>` · sem co-autoria de IDE.
   Merges: **sempre** `bash scripts/merge-pr.sh <n>` (ou `gh pr merge <n> --merge --subject "merge: 🔀 PR #<n> — <branch>"`). Proibido deixar o default `Merge pull request…`.
4. Agentes são **plugins** — não expor chamada direta no UX principal.
5. Policies > prompts longos.
6. Não implementar todos os engines de uma vez — seguir ROADMAP (Fase 1 = núcleo).
7. Commits só quando o humano pedir (exceto bootstrap autorizado).

## Checklist

- [ ] Mudança alinhada à fase do ROADMAP?
- [ ] Docs/ADR se decisão arquitetural?
- [ ] CHANGELOG `[Unreleased]` se notável?
- [ ] PR para `sandbox`?
