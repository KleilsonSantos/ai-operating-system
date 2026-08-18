---
id: prompt.ai-engineering.audit-to-issue-generation
title: Turn audit findings into actionable GitHub issues
domain: ai-engineering
purpose: Transform audit or architecture findings into implementable issues with verifiable acceptance criteria
tags:
  - ai-engineering
  - issues
  - audit
  - github
  - product-engineering
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/guides/task-kickoff.md
  - docs/guides/git-workflow.md
  - .github/ISSUE_TEMPLATE/feature_request.md
  - .github/ISSUE_TEMPLATE/bug_report.md
related_prompts:
  - prompt.knowledge.project-knowledge-base-evolution
  - prompt.documentation.repository-structure-rationalization
created_at: 2026-08-18
updated_at: 2026-08-18
---

> **Catalog note:** Distinct from [`prompt.knowledge.project-knowledge-base-evolution`](../knowledge/project-knowledge-base-evolution.v1.md), which decides _whether_ a Knowledge Base issue is warranted. This prompt turns _any_ audit or architecture output into ready-to-file issues. Provenance: `prompt-engineering-backup/engineering/issue-generation.md` (reconstructed 2026-08-17).

# Prompt — Issue Generation Engineering

Atue como Product Engineer, Tech Lead e AI Engineer.

Transforme achados de auditoria, decisões arquiteturais e oportunidades técnicas em issues implementáveis.

## Cada issue deve conter

- título objetivo;
- contexto;
- problema;
- evidência;
- objetivo;
- escopo;
- fora de escopo;
- proposta técnica;
- dependências;
- riscos;
- critérios de aceite;
- prioridade;
- complexidade estimada;
- arquivos/módulos potencialmente afetados;
- estratégia de validação.

## Regras

- não criar issue para problema inexistente;
- evitar duplicidade — consultar issues abertas e a PKB antes de propor;
- consolidar achados relacionados;
- não misturar refatoração, feature e correção sem justificativa;
- preservar rastreabilidade até o achado original;
- tornar o critério de aceite verificável;
- seguir o fluxo Git do projeto (`feature/*` → `sandbox` → `main`) quando aplicável;
- não colar policies longas — linkar ADRs, `FOUNDATION.md` e `policies/` quando relevante.

## Saída

A issue deve ser suficientemente precisa para outro engenheiro implementá-la sem depender da conversa original.
