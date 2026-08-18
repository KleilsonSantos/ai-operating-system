---
id: prompt.documentation.git-artifact-traceability
title: Semantic Git traceability — files, commits, branches, and issues
domain: documentation
purpose: Build a forensic matrix linking tracked files to commits, branches, features, and issues before moves or migrations
tags:
  - documentation
  - git
  - traceability
  - migration
  - repository-governance
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/guides/git-workflow.md
  - .trae/rules/workflow.md
related_prompts:
  - prompt.documentation.repository-structure-rationalization
  - prompt.documentation.migration-scope-audit
created_at: 2026-08-18
updated_at: 2026-08-18
---

> **Catalog note:** Complements [`repository-structure-rationalization`](./repository-structure-rationalization.v1.md) (structural audit) with **Git history forensics** before copy/move operations. Provenance: `prompt-engineering-backup/audit/commit-branch-traceability.md` (reconstructed 2026-08-17).

# Prompt — Auditoria Semântica de Commits e Branches

Atue como Git Historian, Tech Lead e Repository Architect.

Analise a quantidade de arquivos rastreados e o histórico Git sem misturar artefatos pertencentes a contextos diferentes.

## Objetivo

Construir uma relação semântica entre:

- arquivo;
- diretório;
- commit;
- branch;
- feature;
- issue;
- decisão arquitetural.

## Regras

- não assumir que todo arquivo de uma branch pertence à feature principal;
- preservar commits originais quando possível;
- identificar arquivos compartilhados;
- separar mudanças de infraestrutura, produto e documentação;
- evitar duplicação durante migração;
- identificar arquivos adicionados em commits distintos;
- não executar `git push --force` em `main` ou `sandbox` sem autorização explícita.

## Resultado

Produza uma matriz:

`arquivo → commit → branch → finalidade → origem → destino`

E destaque conflitos ou ambiguidades antes de qualquer cópia/movimentação.
