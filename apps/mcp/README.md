# @aios/mcp — MCP server (Nível 2)

Liga o **Agent do Cursor** ao runtime AIOS (`runPipeline`, policies, workspaces).

## Tools

| Tool | Papel |
| --- | --- |
| `aios_contract_version` | Versão do contrato (`1`) |
| `aios_compile_prompt` | Brief governado (#59) |
| `aios_list_workspaces` | Registry multi-repo (#43) |
| `aios_workspace_upsert` / `remove` / `validate` | Multi-repo genérico (#55) |
| `aios_run_across_workspaces` | Pipeline em lote (#55) |
| `aios_build_knowledge` | Knowledge Graph (#47) |
| `aios_memory_remember` / `aios_memory_recall` / `aios_memory_clear` | Memory (#51) |
| `aios_load_policies` | Carrega policies + constraints |
| `aios_run_pipeline` | Núcleo completo → `PipelineResponse` |

## Cursor / MCP config

Preferir **caminho absoluto do `node`** (GUI do Cursor costuma não herdar `nvm`/`pnpm`):

Ver [`.cursor/mcp.json.example`](../../.cursor/mcp.json.example). Defina `AIOS_HOME` para o monorepo AIOS.

Variáveis: `AIOS_HOME`, `AIOS_REPO`, `AIOS_WORKSPACE`, `AIOS_SCOPE`, `AIOS_POLICIES_PATH`, `AIOS_WORKSPACES_PATH`.

Issue #38 · #43 · guia [cursor-chat-bridge](../../docs/guides/cursor-chat-bridge.md) · ADR-0003 · ADR-0004.
