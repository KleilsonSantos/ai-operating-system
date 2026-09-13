# AIOS Postman integration artifacts

This directory contains versioned Postman artifacts for the HTTP surfaces currently implemented by AIOS.

## Scope

The collection covers only routes verified in source code:

- Console API (`apps/console/src/server.ts`): health, governance status, safe-action catalog, Prometheus metrics, and all safe actions.
- MCP Streamable HTTP (`apps/mcp/src/http.ts`): health, JSON-RPC initialization/tool discovery/tool call, and the documented `405 Method Not Allowed` behavior for GET and DELETE on the stateless `/mcp` endpoint.

CLI commands, stdio MCP, and internal engine functions are not HTTP endpoints and are intentionally not represented as Postman requests.

## Layout

```text
integrations/postman/
├── collections/
│   ├── AIOS - Smoke Tests.postman_collection.json
│   ├── AIOS - Functional Tests.postman_collection.json
│   ├── AIOS - Negative Tests.postman_collection.json
│   ├── AIOS - Regression Tests.postman_collection.json
│   ├── AIOS - Workflows.postman_collection.json
│   └── AIOS - MCP HTTP.postman_collection.json
├── environments/
│   ├── aios.local.postman_environment.json
│   ├── aios.test.postman_environment.json
│   └── aios.prod.template.postman_environment.json
└── README.md
```

The environment files contain URLs and non-sensitive test defaults only. Do not commit tokens, passwords, private keys, or machine-specific paths. The production file is a template and must be populated through a secret manager or local Postman values before use.

## Start local services

Console API:

```bash
export AIOS_HOME="$PWD"
pnpm --filter @aios/console api
```

MCP Streamable HTTP:

```bash
export AIOS_HOME="$PWD"
pnpm --filter @aios/mcp dev:http
```

The default loopback endpoints are `http://127.0.0.1:8787` and `http://127.0.0.1:8791`. The MCP HTTP transport is opt-in. Keep both services bound to loopback for local work.

## Import and run

1. Import one or more files from `collections/` into Postman.
2. Import one environment from `environments/` and select it in the environment picker.
3. Run `AIOS - Smoke Tests` first.
4. Run `AIOS - Functional Tests` only in an isolated local/test environment.
5. Run `AIOS - Negative Tests` to verify documented error contracts.
6. Run `AIOS - Regression Tests` for stable contracts.
7. Run `AIOS - Workflows` to validate request chaining.
8. Run `AIOS - MCP HTTP` only after starting the opt-in MCP HTTP server.

`memory_remember` writes to the local memory store. Treat it as a manual request and do not run it against production without explicit approval. `provider_ping` may require a reachable Ollama provider and can therefore legitimately report an unhealthy provider while the Console API itself is available.

## Execution matrix

| Suite      |       Local |                     Test |                  Staging |                           Production |
| ---------- | ----------: | -----------------------: | -----------------------: | -----------------------------------: |
| Smoke      | PASS/usable | applicable when deployed | applicable when deployed |                       read-only only |
| Functional |         yes |                      yes |       only with approval |                                   no |
| Negative   |         yes |                      yes |       only with approval |                                   no |
| Regression |         yes |                      yes |        yes when deployed |             read-only contracts only |
| Workflows  |         yes |                      yes |       only with approval |                                   no |
| MCP HTTP   | when opt-in |              when opt-in |              when opt-in | only with explicit security approval |

`PASS/usable` is an execution policy, not a claim that every environment exists. This repository currently documents local services; test, staging, and production URLs remain deployment-specific.

## Traceability

| Test ID range    | Surface                                                            | Source of truth                                      | Collection |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------------------- | ---------- |
| `SMOKE-001..004` | Console health/status/metrics and MCP health                       | `apps/console/src/server.ts`, `apps/mcp/src/http.ts` | Smoke      |
| `FUNC-001..011`  | Console safe actions                                               | `apps/console/src/actions.ts`                        | Functional |
| `NEG-001..006`   | Validation, parse, 404, and MCP 405 behavior                       | `apps/console/src/server.ts`, `apps/mcp/src/http.ts` | Negative   |
| `REG-001..004`   | Contract version, metrics alias, action catalog, MCP contract tool | source handlers, README, existing tests              | Regression |
| `WORKFLOW-001`   | Health -> action discovery -> compile -> operational state         | Console API synchronous action contract              | Workflows  |
| `MCP-001..006`   | Streamable HTTP lifecycle and stateless method behavior            | `apps/mcp/src/http.ts`, `apps/mcp/README.md`         | MCP HTTP   |

Coverage is measured against discovered HTTP surfaces. CLI, MCP stdio, engines, packages, and plugins are `N/A` here because they do not expose HTTP endpoints.

## Known limitations

- There is no HTTP authentication contract in the current handlers, so the collections intentionally do not invent authorization headers.
- MCP HTTP is opt-in and stateless. The server currently returns `405` for GET and DELETE on `/mcp`; the collection records that behavior rather than assuming session management.
- The current functional suite invokes all safe actions, but provider health depends on an available Ollama service.
- `memory_remember` is a state-changing request and is not production-safe.
- No staging or production deployment configuration was found in the repository; the production environment remains a placeholder.

## Environment policy

- `local`: loopback URLs and the repository workspace.
- `test`: separate logical workspace ID; point URLs at an isolated test deployment when one exists.
- `prod.template`: placeholders only. Never use it with unresolved placeholders or shared test data.

The collection uses collection variables as safe defaults and environment variables as deployment-specific overrides. No authorization header is included because the current source handlers do not implement an HTTP authentication contract. Add authentication only when the server contract adds it; do not invent a client-side secret.

## Validation

Validate all artifacts before importing:

```bash
for file in integrations/postman/collections/*.json integrations/postman/environments/*.json; do
  jq empty "$file" || exit 1
done
```

To run the requests in CI, use the Postman CLI or Newman only after the target services are started. Keep the environment file explicit and avoid exporting production secrets in shell history.

## References

- [Postman collection creation](https://learning.postman.com/docs/use/use-collections/create-collections.md)
- [Postman collection management](https://learning.postman.com/docs/use/use-collections/manage-collections.md)
- [Postman environment variables](https://learning.postman.com/docs/use/send-requests/variables/variables/)
- [MCP Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports/)
- [MCP lifecycle](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle/)
