# ADR-0022: MCP Streamable HTTP transport (opt-in)

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Kleilson dos Santos
- **Issue:** #137

## Context

`@aios/mcp` shipped as **stdio-only** (#38). Cursor and Companion spawn a local process. Clients that cannot attach stdio (remote IDE bridges, long-lived HTTP agents) need the MCP [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports) transport.

Always-on HTTP conflicts with Resource-Aware / inspect-before-install (ADR-0011).

## Decision

1. Keep **stdio as the default** transport (Cursor `.cursor/mcp.json` unchanged).
2. Add **opt-in** Streamable HTTP when `AIOS_MCP_HTTP=1` and/or `--http`.
3. Bind **`127.0.0.1` by default** via SDK `createMcpExpressApp({ host })` (DNS rebinding protection). Override with `AIOS_MCP_HOST` only when intentional.
4. Default port **`8791`** (`AIOS_MCP_PORT` / `--port`) — distinct from console `8787` and Companion surface `8790`.
5. **Stateless** MVP: new `McpServer` + `StreamableHTTPServerTransport` per `POST /mcp` (SDK `simpleStatelessStreamableHttp` pattern). Same `aios_*` tools as stdio.
6. Expose `GET /health` for probes. No auth/TLS/`0.0.0.0` in this vertical.
7. Companion does **not** switch to HTTP by default.

## Consequences

### Positive

- Same tool surface over HTTP without a second MCP package
- Off by default → no idle listener until requested
- Aligns with official TypeScript SDK Streamable HTTP examples

### Trade-offs

- Stateless = no session resume / SSE GET in MVP (acceptable for local control-plane calls)
- Opt-in HTTP still holds an open port while running (user must start it)
- Express arrives via MCP SDK (`createMcpExpressApp`) — not a second HTTP stack invented in-house

## References

- MCP TypeScript SDK `StreamableHTTPServerTransport` · `createMcpExpressApp`
- [ADR-0003](./0003-pipeline-contract.md) · [ADR-0011](./0011-resource-aware-runtime.md) · [ADR-0014](./0014-control-plane-companion.md)
