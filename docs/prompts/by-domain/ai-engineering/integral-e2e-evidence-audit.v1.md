---
id: prompt.ai-engineering.integral-e2e-evidence-audit
title: Integral E2E evidence audit (toolchain + usability + tools + other projects)
domain: ai-engineering
purpose: Run a reproducible evidence audit of AIOS that cannot finish after compile/test alone
tags:
  - ai-engineering
  - audit
  - e2e
  - mcp
  - usability
  - integration
  - evidence
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/FOUNDATION.md
  - docs/ROADMAP.md
  - docs/guides/control-plane-companion.md
  - docs/adr/0003-pipeline-integration-contract.md
  - docs/adr/0014-control-plane-companion.md
  - docs/adr/0022-mcp-streamable-http.md
  - apps/console/README.md
  - apps/mcp/package.json
related_prompts:
  - prompt.ai-engineering.audit-to-issue-generation
  - prompt.documentation.repository-structure-rationalization
created_at: 2026-08-18
updated_at: 2026-08-18
---

> **Catalog note:** Distinct from documentation-structure audits. This prompt **executes** AIOS. A 2026-08-18 run on `v0.40.0` showed that finishing after typecheck/test/CI is an incomplete audit — the owner required usability, every MCP tool, other-project integration, and interactivity. Do not run unless the owner authorizes a run (`ok` / `prossegue`). After findings, use [`prompt.ai-engineering.audit-to-issue-generation`](./audit-to-issue-generation.v1.md) to file issues.

# AIOS — Auditoria integral com evidência de uso

## Papel

Principal Software Engineer + QA Lead + SDET + DevSecOps + Architect.

Repositório: `https://github.com/KleilsonSantos/ai-operating-system`  
Local: `ai-operating-system/` · branch auditada: **`main`** (lock no SHA inicial).

## Objetivo

Determinar, com evidência de **execução**, quanto do AIOS funciona de verdade — não se compila.

**A auditoria NÃO está completa** se só passou install/build/typecheck/lint/test/CI.

Há dois passes **obrigatórios**. Encerrar após o Passo 1 é **FAIL do processo de auditoria**, não um atalho.

| Passo | Nome                                                                            | Sem isto, status da auditoria |
| ----- | ------------------------------------------------------------------------------- | ----------------------------- |
| 1     | Toolchain e contrato                                                            | INCOMPLETE                    |
| 2     | Uso real: CLI UX, **todas** as tools MCP, console interativo, **outro projeto** | COMPLETE (só então)           |

## Status vocabulary (usar só estes)

`IMPLEMENTED` `TESTED` `EXECUTED` `PASS` `PARTIAL` `FAIL` `BLOCKED` `NOT_TESTED` `NOT_APPLICABLE` `UNVERIFIED`

**FUNCIONAL** exige evidência de execução. Arquivo, teste escrito, README, workflow ou mock **não** bastam.

**UI FUNCIONAL** exige SPA servida **e** as ações que o humano dispara (Try it / API dos botões). Build Vite ou `GET /api/health` sozinhos = `PARTIAL` no máximo.

**MCP FUNCIONAL** exige **invocar cada tool do catálogo** (`MCP_TOOL_CATALOG` em `@aios/shared`), não só `tools/list` / initialize.

**Integração** exige pelo menos um repo que **não** seja o próprio AIOS (Companion local se existir; senão fixture temporário). `runPipeline` só em `AIOS_HOME` = `PARTIAL`.

## Não fabricar evidência

Proibido inventar logs, métricas, cobertura, respostas, CI, screenshots.  
`BLOCKED` deve listar: comando, pré-condição ausente, motivo, impacto, como desbloquear.

## Snapshot e preservação

Antes de qualquer comando: `pwd`, `git status --short --branch`, `HEAD`, `node`/`pnpm`/`git --version`, OS/arch.

Registrar `AUDIT_DATE` `COMMIT_SHA` `BRANCH` `NODE_VERSION` `PNPM_VERSION` `OS` `ARCHITECTURE`. O SHA entra em **todo** relatório. Não trocar de commit no silêncio.

Não destruir trabalho sujo. Ao final `git status --short`. Reverter upsert de workspace, memória de fixture e qualquer write da auditoria. Não commitar `.env`. Não publicar npm (`create-agent:publish` = `NOT_EXECUTED`).

Evidências **fora** do Git: `.tmp/audit-<date>/` (gitignored) ou diretório externo. Não poluir `docs/` a menos que o owner peça snapshot em `docs/audits/`.

---

# Passo 1 — Toolchain (necessário, insuficiente)

Inventário real (`apps/` `packages/` `engines/` `scripts/` `docs/` `.github/` `.githooks/` `.cursor/` `.trae/`). Vazios, órfãos, scripts `node -e "process.exit(0)"` (lint/test fake).

Mapa docs vs código: FOUNDATION, ROADMAP, ADRs, implementação, testes, CI.

Executar (capturar exit code, duração, log):

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:coverage
pnpm build
pnpm audit
pnpm sync:cursor-rules && git diff --exit-code
```

Validar **artefatos** de build (não só exit 0). MCP `tsc --noEmit` sem `dist` é finding, não PASS silencioso.

Pipeline real **neste** repo:

```bash
export AIOS_HOME=$PWD
pnpm --filter @aios/cli dev -- "analyze the project"
```

Registrar input, engines, policies, verdict, exit code. Sem mocks.

CI: `gh run list` no **mesmo SHA**. Diferenciar workflow configurado vs run verde. Comparar Node local vs CI.

Hooks: listar `.githooks/`, `core.hooksPath`; não commitar.

Segurança: `pnpm audit`; grep secrets/eval/exec; `.env` vs `.env.example`; `SECRET_PRESENT=YES` sem dump.

Isto **não** autoriza fechar a auditoria.

---

# Passo 2 — Uso, tools, outro projeto (bloqueante)

Não pular porque “parece secundário”. Sem Passo 2 o veredito final deve ser no máximo `ORANGE` e a auditoria `INCOMPLETE`.

## 2.1 CLI como produto (UX)

Happy path **e** negativo, com stdout/stderr/exit reais:

- `--contract-version`, `--list-agents`, `--audit-docs`, `--compile-prompt`, `--governance-status`, `--metrics-prometheus`
- `--help` / flag desconhecida (não pode ser “pipeline com intent unknown” sem classificar `FAIL` de UX)
- `--workspace` inexistente
- `--provider-health` (Ollama ausente = `BLOCKED`, não fingir PASS)
- `--repo <outro-projeto>` (ver 2.4)

Scripts `test`/`lint` no-op no `@aios/cli` = finding HIGH, mesmo com `pnpm test` verde na raiz.

## 2.2 MCP — 100% das tools

Ler `MCP_TOOL_CATALOG` + `MCP_TOOL_PRIVILEGE` em `packages/shared`.

Subir HTTP **opt-in temporário** (não deixar ligado):

```bash
AIOS_MCP_QUIET=1 AIOS_MCP_HTTP=1 AIOS_MCP_PORT=<ephemeral> pnpm --filter @aios/mcp dev -- --http --port <ephemeral>
```

Preferir o mesmo runtime que o produto usa para MCP (`tsx` no `package.json` do app). Se um cliente externo spawnar `node --experimental-strip-types`, isso é **outro** contrato — executar os dois e não misturar o resultado.

Para **cada** tool do catálogo: `tools/call` com argumentos válidos. Registrar HTTP, `isError`, preview.

Regras:

- `aios_workspace_remove` sem `AIOS_MCP_ALLOW_PRIVILEGED=1` deve ser `policy.denied` = PASS do gate.
- Não `aios_memory_clear` no workspace de produção (`aios`). Usar id efémero e limpar só esse.
- `aios_workspace_upsert` de outro repo: depois `git checkout -- workspaces/aios.workspaces.json` (ou equivalente).
- `aios_provider_chat` / health / models: `BLOCKED` se o daemon não existir.
- Também: initialize, `tools/list`, request inválido, GET `/mcp` (405 se stateless), `/health`, shutdown.

Stdio: se não houver cliente, `NOT_TESTED` explícito — não inferir do HTTP.

Cursor MCP `user-aios` (ou equivalente): tentar discovery. Se `serverStatus=error`, `BLOCKED` (IDE), distinto do HTTP local.

## 2.3 Console — interatividade

Subir API **e** UI (`pnpm --filter @aios/console dev`). Encerrar no fim.

Obrigatório:

1. `GET /api/health`, `GET /api/status` (agents, `exposed.mcpTools`, attention, provider).
2. **Todas** as ações de Try it (`SAFE_ACTIONS` / `TryItPanel`) via `POST /api/action` com o mesmo body dos botões.
3. GET da SPA (Vite). HTML com root/bundle. Proxy `/api` através da UI se existir.
4. Se houver browser automation: clicar Atualizar, filtros do catálogo, cada Try it, empty/error/loading. Sem browser: UI = `PARTIAL` (API dos botões + SPA HTTP). **Proibido** `PASS` de UI só com `vite build`.

## 2.4 Outro projeto (integração)

Se `../aios-companion` (ou `AIOS_COMPANION_HOME`) existir:

- CLI `--repo` nesse path + `analyze the project`
- MCP `aios_run_pipeline` / `aios_build_knowledge` com `repoPath` absoluto
- `aios_run_across_workspaces` após upsert temporário
- Smoke do **cliente**: `pnpm smoke:mcp-http` no Companion com `AIOS_HOME` (é o contrato Companion↔AIOS, não o MCP via tsx)

Se o smoke do cliente falhar e o MCP via `tsx` passar, classificar **dois** resultados. Não esconder o FAIL do cliente.

Se não houver Companion: criar fixture git mínimo em tmp, upsert, across, remover/reverter.

`aios_audit_docs` noutro repo sem árvore canónica AIOS tende a `PARTIAL`/`FAIL` — não é prova de que o engine está quebrado no monorepo.

## 2.5 Engines, plugins, policies (ainda obrigatório, depois do uso)

Tabela por engine: existe, export, consumidor, testes, testes executados, no pipeline?, docs.

Plugins: discovery + execução no E2E (não só `.md`).

Policies: `pnpm sync:cursor-rules`; drift de `.sync-meta.json` conta.

---

# Matrizes e entregáveis

Além das matrizes de funcionalidade/comando/teste/integração/docs/segurança:

| Extra             | Conteúdo                                              |
| ----------------- | ----------------------------------------------------- |
| Tool matrix       | 1 linha por `aios_*` — invocada? resultado? evidência |
| Try-it matrix     | 1 linha por ação do console                           |
| Other-repo matrix | CLI, MCP, across, cliente Companion                   |

Evidências `EVID-NNN` com comando, SHA, esperado, observado, exit, log.

Pasta: `executive-summary.md`, `environment.md`, inventário, arquitetura, matrizes, findings, recommendations, `evidence/`, `raw/`.

## Production ready / cor / score

Não declarar production ready por build+test.

Dimensões (0–100, CRITICAL bloqueia GREEN): Build 10, Types 10, Tests 15, **Integration/E2E/usability 25** (sobe o peso vs toolchain), Architecture 10, Security 10, CI 5, Docs 5, Observability 5, Repro 5. Maintainability entra em findings, não como desconto silencioso.

Cores: GREEN / YELLOW / ORANGE / RED — iguais à definição usual. Auditoria sem Passo 2 ⇒ no máximo **ORANGE** e `INCOMPLETE`.

## Findings

`FINDING-ID` Severity Title Component Evidence Expected Observed Impact Root Cause Recommendation Effort Status.

Severidade: CRITICAL HIGH MEDIUM LOW INFO.

## Três listas obrigatórias

1. Comprovadamente funcional (só com evidência)
2. Implementado, não comprovado
3. Não funcional / quebrado / BLOCKED

“O que o projeto finge”: documentado ≠ implementado ≠ testado ≠ executado ≠ integrado. Linguagem: “não há evidência suficiente”, não “é falso”.

## 20 perguntas (responder com evidência)

As 20 originais (compila, typecheck, lint, testes, cobertura real, pipeline, CLI, MCP, console, engines, plugins, policies, quality gate, CI, vulns, docs-only, untested, broken, orphans, production ready) **mais**:

21. Cada tool MCP foi invocada?
22. Try it / ações da UI foram exercitadas?
23. Há evidência contra **outro** repositório?
24. O cliente Companion (ou equivalente) fala com este SHA?

## Frase-guia

> Não quero saber se existe. Quero saber se funciona. Não quero saber se o teste existe. Quero saber se rodou. Não quero saber se o build passou. Quero saber se um humano (CLI, MCP tool, botão do console, outro repo) obteve o resultado esperado, com comando, exit code, SHA e evidência.

Não encerrar com “todos os testes passaram.”
