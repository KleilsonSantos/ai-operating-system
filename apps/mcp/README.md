# @aios/mcp — MCP server (Nível 2)

Liga o **Agent do Cursor** ao runtime AIOS (`runPipeline`, policies).

## Tools

| Tool | Papel |
| --- | --- |
| `aios_contract_version` | Versão do contrato (`1`) |
| `aios_load_policies` | Carrega policies + constraints |
| `aios_run_pipeline` | Núcleo completo → `PipelineResponse` |

## Cursor / MCP config

No Cursor MCP settings (ou `.cursor/mcp.json` se suportado no projeto), algo como:

```json
{
  "mcpServers": {
    "aios": {
      "command": "pnpm",
      "args": ["--filter", "@aios/mcp", "exec", "node", "--experimental-strip-types", "./src/index.ts"],
      "cwd": "/ABS/PATH/TO/ai-operating-system"
    }
  }
}
```

Ou, a partir de `apps/mcp`:

```bash
pnpm --filter @aios/mcp dev
```

Variáveis: `AIOS_REPO`, `AIOS_SCOPE`, `AIOS_POLICIES_PATH`.

Issue #38 · guia [cursor-chat-bridge](../../docs/guides/cursor-chat-bridge.md) · ADR-0003.
