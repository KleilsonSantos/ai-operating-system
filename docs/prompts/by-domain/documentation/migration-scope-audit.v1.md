---
id: prompt.documentation.migration-scope-audit
title: Migration scope audit — what was copied, skipped, or deliberately excluded
domain: documentation
purpose: Audit a copy/migration between project structures and classify each artifact before reintroducing or deleting
tags:
  - documentation
  - migration
  - repository-governance
  - artifact-lifecycle
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/FOUNDATION.md
  - policies/aios.policies.json
  - docs/audits/README.md
related_prompts:
  - prompt.documentation.git-artifact-traceability
  - prompt.documentation.repository-structure-rationalization
created_at: 2026-08-18
updated_at: 2026-08-18
---

> **Catalog note:** Use when comparing two repos or trees (e.g. portfolio → AIOS bootstrap). Pair with [`git-artifact-traceability`](./git-artifact-traceability.v1.md) for history; pair with [`repository-structure-rationalization`](./repository-structure-rationalization.v1.md) for post-migration hygiene. Provenance: `prompt-engineering-backup/audit/copy-migration-scope.md` (reconstructed 2026-08-17).

# Prompt — Auditoria de Escopo de Cópia e Migração

Audite uma operação de cópia/migração entre estruturas de projeto.

## Objetivo

Determinar com precisão:

- o que foi copiado;
- o que não foi copiado;
- o que foi excluído deliberadamente;
- o que precisa ser preservado;
- o que não deve ser migrado.

## Caso conhecido

Itens como:

- `Cadence next / ok / green`;
- `.trae/`;
- Sonar;
- Codecov;
- `lint-staged` no pre-commit;

podem representar componentes deliberadamente não copiados e devem ser analisados individualmente, não simplesmente reintroduzidos.

## Para cada item

Classifique como:

- obrigatório;
- opcional;
- legado;
- específico de ambiente;
- específico de produto;
- gerado;
- deliberadamente excluído;
- precisa de decisão.

## Regra

A ausência de um artefato não deve ser tratada como erro sem entender a decisão que originou a ausência.

Respeite a policy `artifact-lifecycle`: não criar `tmp/`, `backup/`, `final/` ou nomes datados para documentação viva.
