# Ponte Cursor Chat ↔ AIOS

O Agent do Cursor **não** descobre o AIOS sozinho. Duas camadas:

## Nível 1 — Project Rules (sempre ligado neste repo)

```text
Você digita no chat (pedido curto)
        ↓
Cursor Agent carrega .cursor/rules/*.mdc (alwaysApply)
        ↓
Conteúdo gerado a partir de policies/aios.policies.json
```

```bash
pnpm sync:cursor-rules
```

- `.cursor/rules/aios-policies.mdc`
- `.cursor/rules/aios-sdlc.mdc`

## Nível 2 — MCP server (`@aios/mcp`) — issue #38

Ligação **viva** com o runtime: o Agent chama tools.

| Tool | Papel |
| --- | --- |
| `aios_contract_version` | `contractVersion` |
| `aios_compile_prompt` | Brief governado (policies + memory + KG) — **economia de tokens** (#59) |
| `aios_list_workspaces` | Registry multi-repo (Fase 2 · #43) |
| `aios_workspace_upsert` / `remove` / `validate` | Multi-repo genérico (#55) |
| `aios_run_across_workspaces` | Pipeline em N workspaces (#55) |
| `aios_build_knowledge` | Knowledge Graph heurístico (#47; `full: true` = nós/arestas) |
| `aios_memory_remember` / `recall` / `clear` | Memória sessão/projeto (#51) |
| `aios_load_policies` | Policies + constraints |
| `aios_run_pipeline` | Núcleo completo (`PipelineResponse`; aceita `workspaceId`) |
| `aios_provider_health` / `models` / `chat` | Multi-provider auxiliar Ollama (#67) |
| `aios_governance_status` | Health + Attention do console (#71) |
| `aios_audit_docs` | Inventário/drift de docs canónicas (#80) |
| `aios_governance_audit` / `aios_governance_record` | Auditoria leve + log de decisões (#80) |

Exemplo de config: [`.cursor/mcp.json.example`](../../.cursor/mcp.json.example) — use **caminho absoluto do `node`** (Cursor GUI frequentemente não tem `pnpm`/`nvm` no PATH).

Se o Agent **não listar** as tools `aios_*` (só vê MCPs de `~/.cursor/mcp.json`), copie o bloco `aios` também para o MCP **user-level** (`~/.cursor/mcp.json`), defina `AIOS_HOME`, e faça Settings → MCP → Refresh / Reload Window → **chat Agent novo**.

```bash
pnpm --filter @aios/mcp dev
```

Workspaces: [`workspaces/aios.workspaces.json`](../../workspaces/aios.workspaces.json) · [ADR-0004](../adr/0004-multi-repo-workspace-registry.md).

Detalhe: [`apps/mcp/README.md`](../../apps/mcp/README.md) · contrato [ADR-0003](../adr/0003-pipeline-integration-contract.md).

## Smoke CLI

```bash
# Brief governado (cola no Agent / economiza tokens)
pnpm --filter @aios/cli dev -- --compile-prompt --brief-only --workspace=aios "Crie um endpoint de health."

# Pipeline completo
pnpm --filter @aios/cli dev -- --workspace=aios "Analise meu projeto."
```
