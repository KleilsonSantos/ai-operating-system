---
id: prompt.ai-engineering.product-purpose-integral-validation
title: Product & purpose integral validation (architecture + E2E + theater)
domain: ai-engineering
purpose: Evidence-based audit of how far AIOS fulfills its purpose as a governed AI OS for SDLC — not compile/test alone
tags:
  - ai-engineering
  - audit
  - product-validation
  - purpose-alignment
  - e2e
  - governance
  - theater-detection
  - observability
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/FOUNDATION.md
  - docs/VISION.md
  - docs/ROADMAP.md
  - docs/architecture/overview.md
  - docs/architecture/system-guide.md
  - docs/architecture/harness-mapping.md
  - docs/adr/0001-standalone-platform.md
  - docs/adr/0003-pipeline-integration-contract.md
  - docs/adr/0010-governance-console.md
  - docs/adr/0011-resource-aware-macos.md
  - docs/adr/0014-control-plane-companion.md
  - docs/adr/0024-execution-state-capability-registry.md
  - docs/adr/0029-ai-harness-mapping.md
  - docs/adr/0030-visibility-plane-obsidian-export.md
  - policies/aios.policies.json
related_prompts:
  - prompt.ai-engineering.integral-e2e-evidence-audit
  - prompt.ai-engineering.aios-implementation-mission
  - prompt.ai-engineering.aios-master-architecture
  - prompt.ai-engineering.audit-to-issue-generation
created_at: 2026-08-29
updated_at: 2026-08-29
---

> **Catalog note:** **Product / purpose** validation — “does AIOS behave like the OS it claims to be?” Distinct from [`integral-e2e-evidence-audit`](./integral-e2e-evidence-audit.v1.md) (toolchain + every MCP tool + other-project UX) and from [`aios-implementation-mission`](./aios-implementation-mission.v1.md) (gap → plan → implement). Prefer **this** prompt for purpose matrices, theater detection, and OBSERVE→GOVERN cycle. Prefer **integral-e2e** when the goal is exhaustive MCP/CLI/Console execution inventory. Do **not** run unless the owner authorizes (`ok` / `prossegue` / `executar auditoria`). After findings, use [`audit-to-issue-generation`](./audit-to-issue-generation.v1.md). **Do not modify product code** to hide gaps.

# AIOS — Auditoria Integral de Produto, Arquitetura, Execução e Aderência ao Propósito

## Binding local (obrigatório neste chat / workspace)

| Campo                     | Valor                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Repo remoto               | `https://github.com/KleilsonSantos/ai-operating-system`                                                                      |
| Workspace local           | `/Users/kleilson/Projects/ai-operating-system` (ou `$AIOS_HOME` se definido)                                                 |
| Branch/tag de referência  | Preferir `main` no SHA atual; registrar `COMMIT_SHA` + SemVer (`package.json`, ex. ≥ `0.44.0`)                               |
| Clone                     | **Não** clonar de novo — auditar o tree já aberto                                                                            |
| Evidências                | `.tmp/audit-purpose-<YYYY-MM-DD>/` (gitignored) — **não** poluir `docs/` a menos que o owner peça snapshot em `docs/audits/` |
| Resource-Aware (ADR-0011) | Reusar Console/API/provider já ativos; não instalar Ollama só para “ficar verde”; `inspect-before-install`                   |
| Código                    | **Não alterar** produto na 1ª passagem. Se precisar de fixture/env: marcar `TEST ENVIRONMENT MODIFICATION`                   |
| Políticas                 | Não colar o Policy Engine no relatório — citar ids em `policies/aios.policies.json`                                          |
| Pós-auditoria             | Issues só via [`audit-to-issue-generation`](./audit-to-issue-generation.v1.md) e com autorização                             |

### Como não duplicar trabalho

| Já existe                     | Use quando…                                                    | Não use este prompt para…                                           |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `integral-e2e-evidence-audit` | Inventário completo CLI/MCP/Console + outro projeto            | Repetir checklist tool-a-tool se já houver run recente no mesmo SHA |
| `aios-implementation-mission` | Plano incremental pós-gap                                      | Implementar na mesma sessão sem `ok`                                |
| Este prompt                   | Propósito, theater, ciclo OBSERVE→GOVERN, scorecard de produto | Só “pnpm test passou?”                                              |

Se um run `integral-e2e` no **mesmo SHA** existir em `.tmp/` ou `docs/audits/`, **reaproveitar** evidências MCP/CLI e aprofundar aqui em purpose/theater/journeys.

---

## Objetivo

Determinar, com **evidências concretas de execução**, quanto o AIOS avançou em relação ao propósito declarado (governance platform for AI in the SDLC), se a arquitetura implementada corresponde à projetada, e se o sistema **de ponta a ponta** entrega comportamento de AI Operating System — não apenas framework/pipeline assistido.

Declarações a **provar ou refutar** (não aceitar só porque estão na docs):

- Governance · Policy · Context · Agents-as-plugins · Decision/Orchestration · Quality gates
- Knowledge · Memory · Prompt · Provider · Workspace · MCP · CLI · Console · Companion
- Cursor bridge · engines/plugins · independência de provider

---

## 1. Regra principal

Não limitar a unit tests, coverage, lint, tsc, existência de arquivos/classes/interfaces/README.

Combinar: Architecture Review · Product Validation · Integration/E2E/User Journey · Contract · Resilience · Failure-mode · DX · Agent workflow · Governance · Security · Observability · Docs↔code consistency.

## 2. Antes de testar — reconstruir o sistema

Ler e correlacionar FOUNDATION · VISION · ROADMAP · ADRs · architecture · guides · PKB · package READMEs · código · testes · CI · scripts · CLI · MCP · Console · engines · plugins · pipeline · shared.

Construir o fluxo teórico:

```text
User → Entry → Intent → Policy → Context → Memory/Knowledge
  → Decision → Orchestration → Provider/Agent/Plugin
  → Execution → Quality Gate → Governance/Observability → Response
```

Comparar com o fluxo **realmente** implementado (citar arquivos).

## 3. Matriz de aderência ao propósito

| Propósito declarado | Implementação encontrada | Executável? | Testado? | Evidência | Status |
| ------------------- | ------------------------ | ----------: | -------: | --------- | ------ |

Status **obrigatórios** (este prompt):

`IMPLEMENTADO E VALIDADO` · `IMPLEMENTADO MAS NÃO VALIDADO` · `PARCIALMENTE IMPLEMENTADO` · `DOCUMENTADO MAS NÃO IMPLEMENTADO` · `IMPLEMENTADO MAS DESCONECTADO` · `MOCK/STUB` · `EXPERIMENTAL` · `QUEBRADO` · `NÃO LOCALIZADO`

Para veredictos de **execução** de um comando/cenário, use também o vocabulário partilhado com E2E: `PASS` · `FAIL` · `PARTIAL` · `NOT VERIFIED` · `NOT APPLICABLE` · `BLOCKED`.

## 4. Existência ≠ funcionalidade

Exigir cadeia: Existência + Integração + Execução + Entrada real + Processamento + Saída observável + Erro tratado + Integração com o resto. Lacuna em qualquer elo → registar.

## 5. Executar o sistema de verdade

Seguir docs locais (`README`, guides). Descobrir: install · build · start · CLI · pipeline · MCP · Console · engines no fluxo · plugins carregados · policies influenciam · context · memory · knowledge · provider runtime · gates · governance · observability · fluxo completo.

Comandos típicos (ajustar paths):

```bash
cd "$AIOS_HOME"
pnpm install
pnpm typecheck   # evidência auxiliar — não fecha a auditoria
pnpm --filter @aios/cli exec tsx ./src/index.ts --help
pnpm --filter @aios/cli exec tsx ./src/index.ts --repo "$AIOS_HOME" "Analyze my project."
pnpm --filter @aios/cli exec tsx ./src/index.ts --visibility --workspace aios --repo "$AIOS_HOME"
pnpm --filter @aios/cli exec tsx ./src/index.ts --export-obsidian --out .tmp/audit-purpose-*/obsidian --repo "$AIOS_HOME"
# Console: reusar :5173/:8787 se já up; senão pnpm --filter @aios/console dev
```

## 6–7. Fluxo E2E + jornadas humanas

Cenário A e jornadas 1–7 (analyze · architecture · security · coverage · failing · implement · validate). Documentar fluxo **observado**. Se o pipeline não sustentar ACT completo, marcar `PARTIAL`/`FAIL` com evidência — não inventar “implementou”.

## 8. Agentes / plugins

Para cada plugin: responsabilidade · contrato · I/O · quem aciona · caminho oficial · discovery · selection · execução · retorno ao pipeline · influência na decisão. Procurar dead plugins · unused engines · mocks · hardcoded routing · bypassed governance.

## 9. Policies e governance

Provar mudança de comportamento (allow · block · warn · conflict). Distinguir governance: real · parcial · declarativa · decorativa · bypassável.

## 10–12. Context · Memory · Provider

Context: origem · filtro · budget · relevância. Memory: create/recall/stale. Provider: A↔B se disponível; senão `NOT VERIFIED` + motivo (Resource-Aware — não obrigar segundo vendor).

## 13–15. MCP · CLI · Console

MCP: client → tool → AIOS → resposta (amostrar tools críticas + capability gate; inventário completo = integral-e2e). CLI: help · inválidos · exit codes. Console: Run trail · Try it · health — “dá para entender estado sem ler código?”

## 16–20. Falhas · Segurança · Observabilidade · Determinismo · Performance

Failure matrix Detectou→…→Estado. Security mínimo (injection · privilege · secrets · path). Observability: quem decidiu / policy / context / engine / provider / gate. Determinismo vs LLM. Perf prática (startup · CLI · gather · provider).

## 21–24. Docs vs realidade · Arquitetura · Evolução · Theater

FOUNDATION vs VISION vs ROADMAP vs ADR vs código vs runtime. Detectar AI / Architecture / Governance / Plugin / Test / Documentation / Abstraction **Theater** com evidência.

## 25–27. UX produto · Ciclo central · Critério de sucesso

Classificar UX: Poor · Basic · Usable · Good · Production Ready · Exceptional.

Ciclo de realidade:

```text
OBSERVE → UNDERSTAND → DECIDE → ACT → VALIDATE → LEARN → GOVERN
```

Sucesso ≠ `pnpm test`. Sucesso = cadeia Intent→…→Observable Result integrada.

## 28–31. Classificação · Scorecard · Lacunas · Doc vs Real

Executive answers 1–14. Scorecard 0–10 (áreas listadas no pedido original). Gap matrix P0–P4. Matriz Documentada/Implementada/Integrada/Executada/Validada/Confiável.

## 32–34. Evidências · Não corrigir · Não inventar

Sempre: arquivo · comando · input · output · veredito. Sem PASS inventado → `NOT VERIFIED`.

## 35. Saída final obrigatória

```text
# AIOS Comprehensive Validation Report

## 1. Executive Summary
## 2. Current Project State
## 3. Purpose Alignment
## 4. Architecture Assessment
## 5. Implementation Assessment
## 6. Integration Assessment
## 7. End-to-End Validation
## 8. User Experience Validation
## 9. CLI Validation
## 10. MCP Validation
## 11. Console Validation
## 12. Engine Validation
## 13. Plugin Validation
## 14. Policy Validation
## 15. Governance Validation
## 16. Context Validation
## 17. Memory Validation
## 18. Knowledge Validation
## 19. Provider Validation
## 20. Quality Gate Validation
## 21. Security Validation
## 22. Failure & Resilience Validation
## 23. Observability Validation
## 24. Performance Observations
## 25. Documentation vs Reality
## 26. Architecture Drift
## 27. AI / Architecture / Test / Governance Theater Findings
## 28. Evidence Matrix
## 29. Gap Matrix
## 30. Scorecard
## 31. Critical Findings
## 32. Recommended Priorities
## 33. What Should Be Built Next
## 34. What Should NOT Be Built Yet
## 35. Final Verdict
## 36. Evidence Appendix
```

## 36. Veredito final (obrigatório)

Responder:

1. Se removesse toda a documentação e avaliasse só o que o sistema demonstra executando, o que existe hoje?
2. O AIOS já é um AI Operating System funcional ou ainda uma arquitetura promissora em transformação?

Sem sycophancy · sem depreciar · evidência > narrativa.

---

## Princípio final

A pergunta central **não** é “quantos testes passam?”.

É:

> O AIOS consegue, de maneira integrada, governada, observável, extensível e confiável, transformar intenção humana em execução assistida por IA e validar o resultado?
