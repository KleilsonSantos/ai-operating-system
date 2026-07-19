# @aios/mcp — MCP server

Bridges Cursor / Companion / HTTP clients to the AIOS runtime (`runPipeline`, policies, workspaces, …).

**Default transport:** stdio. **Opt-in:** Streamable HTTP (ADR-0022 / #137).

## Tools

| Tool | Role |
| --- | --- |
| `aios_contract_version` | Pipeline contract version |
| `aios_compile_prompt` | Governed brief (#59) |
| `aios_list_workspaces` | Multi-repo registry (#43) |
| `aios_workspace_upsert` / `remove` / `validate` | Workspace ops (#55) |
| `aios_run_across_workspaces` | Batch pipeline (#55) |
| `aios_build_knowledge` | Knowledge Graph (#47) |
| `aios_memory_remember` / `recall` / `clear` | Memory (#51) |
| `aios_load_policies` | Policies + constraints |
| `aios_governance_*` / `aios_audit_docs` / `aios_operational_state` | Governance + docs + ops |
| `aios_provider_*` | Provider health / models / chat |
| `aios_run_pipeline` | Full core → `PipelineResponse` |

## Stdio (default)

```bash
pnpm --filter @aios/mcp dev
# or Cursor via .cursor/mcp.json.example
```

Prefer an **absolute `node` path** (Cursor GUI often lacks `nvm`/`pnpm`). Set `AIOS_HOME` to this monorepo.

Env: `AIOS_HOME`, `AIOS_REPO`, `AIOS_WORKSPACE`, `AIOS_SCOPE`, `AIOS_POLICIES_PATH`, `AIOS_WORKSPACES_PATH`, `AIOS_MCP_QUIET=1`.

## Streamable HTTP (opt-in)

Off by default (Resource-Aware). Loopback only unless `AIOS_MCP_HOST` is set.

```bash
pnpm --filter @aios/mcp dev:http
# equivalent:
AIOS_MCP_HTTP=1 node --experimental-strip-types apps/mcp/src/index.ts --http --port 8791
```

- Endpoint: `POST http://127.0.0.1:8791/mcp` (stateless)
- Health: `GET http://127.0.0.1:8791/health`
- Port: `AIOS_MCP_PORT` / `--port` (default **8791**) — distinct from console `8787` and Companion surface `8790`

### Health smoke

```bash
curl -sS http://127.0.0.1:8791/health
# → {"ok":true,"service":"aios-mcp","transport":"streamable-http"}
```

### Companion client

Companion stays on **stdio** unless you set (on the Companion side):

```bash
export AIOS_MCP_URL=http://127.0.0.1:8791/mcp
companion doctor   # expect: http OK · <url>
```

Companion does **not** auto-start this server. Live bridge smoke (Companion repo): `pnpm smoke:mcp-http` with `AIOS_HOME` set. Guide: [control-plane-companion](../../docs/guides/control-plane-companion.md).

Issue #38 · #43 · #137 · [cursor-chat-bridge](../../docs/guides/cursor-chat-bridge.md) · ADR-0003 · ADR-0004 · ADR-0022.
