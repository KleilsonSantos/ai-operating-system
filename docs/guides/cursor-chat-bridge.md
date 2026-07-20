# Cursor Chat ↔ AIOS Bridge

The Cursor Agent does **not** discover AIOS on its own. Two layers:

## Level 1 — Project Rules (always on in this repo)

```text
You type in chat (short request)
        ↓
Cursor Agent loads .cursor/rules/*.mdc (alwaysApply)
        ↓
Content generated from policies/aios.policies.json
```

```bash
pnpm sync:cursor-rules
```

- `.cursor/rules/aios-policies.mdc`
- `.cursor/rules/aios-sdlc.mdc`

## Level 2 — MCP server (`@aios/mcp`) — issue #38

**Live** link to the runtime: the Agent calls tools.

| Tool | Role |
| --- | --- |
| `aios_contract_version` | `contractVersion` |
| `aios_compile_prompt` | Governed brief (policies + memory + KG) — **token savings** (#59) |
| `aios_list_workspaces` | Multi-repo registry (Phase 2 · #43) |
| `aios_workspace_upsert` / `remove` / `validate` | Generic multi-repo (#55) |
| `aios_run_across_workspaces` | Pipeline across N workspaces (#55) |
| `aios_build_knowledge` | Heuristic Knowledge Graph (#47; `full: true` = nodes/edges) |
| `aios_memory_remember` / `recall` / `clear` | Session/project memory (#51) |
| `aios_load_policies` | Policies + constraints |
| `aios_run_pipeline` | Full core (`PipelineResponse`; accepts `workspaceId`) |
| `aios_provider_health` / `models` / `chat` | Multi-provider with optional Ollama (#67) |
| `aios_governance_status` | Console Health + Attention (#71) |
| `aios_audit_docs` | Canonical docs inventory/drift (#80) |
| `aios_search_pkb` | PKB textual / tag search over `docs/prompts/**` (#158) |
| `aios_governance_audit` / `aios_governance_record` | Light audit + decision log (#80) |

Config example: [`.cursor/mcp.json.example`](../../.cursor/mcp.json.example) — use an **absolute `node` path** (Cursor GUI often lacks `pnpm`/`nvm` on PATH).

If the Agent does **not list** `aios_*` tools (only sees MCPs from `~/.cursor/mcp.json`), also copy the `aios` block into the **user-level** MCP file (`~/.cursor/mcp.json`), set `AIOS_HOME`, then Settings → MCP → Refresh / Reload Window → **new Agent chat**.

```bash
pnpm --filter @aios/mcp dev
```

Workspaces: [`workspaces/aios.workspaces.json`](../../workspaces/aios.workspaces.json) · [ADR-0004](../adr/0004-multi-repo-workspace-registry.md).

Details: [`apps/mcp/README.md`](../../apps/mcp/README.md) · contract [ADR-0003](../adr/0003-pipeline-integration-contract.md).

## CLI smoke

```bash
# Governed brief (paste into Agent / saves tokens)
pnpm --filter @aios/cli dev -- --compile-prompt --brief-only --workspace=aios "Crie um endpoint de health."

# Full pipeline
pnpm --filter @aios/cli dev -- --workspace=aios "Analise meu projeto."
```
