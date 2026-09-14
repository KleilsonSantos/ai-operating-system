# AIOS Postman integration artifacts

This directory contains versioned Postman artifacts for the HTTP surfaces currently implemented by AIOS.

## Role in the test stack (anti-redundancy)

| Layer               | Location              | Proves                                                       |
| ------------------- | --------------------- | ------------------------------------------------------------ |
| Unit / engines      | `*.test.ts`           | Internal contracts (hygiene heuristics, path deny, FIFO, …)  |
| Selection evals     | `integrations/evals/` | Intent → agents → capability class (deterministic, CI)       |
| **HTTP live-proof** | **this directory**    | Console `:8787` + MCP HTTP `:8791` **while services are up** |
| MCP stdio live      | `apps/mcp` harness    | Real stdio session (not HTTP)                                |

Do **not** duplicate engine unit assertions or eval goldens inside collections. Collections are for **edge interaction** and audit evidence.

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

Runner (repo root): `scripts/run-postman-audit-pack.sh` — Smoke → Negative → Workflows (+ optional MCP HTTP).

The environment files contain URLs and non-sensitive test defaults only. Do not commit tokens, passwords, private keys, or machine-specific paths. The production file is a template and must be populated through a secret manager or local Postman values before use.

## Start local services

Requires the **infra gate** when an agent starts these processes ([local-runtime-authorization](../../docs/guides/local-runtime-authorization.md)): owner `ok infra`.

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

## Runner: Postman CLI only

Official tool: **[Postman CLI](https://learning.postman.com/docs/postman-cli/postman-cli-overview/)** (`postman collection run`).

Postman documents migration away from **Newman** for current CLI/CI work ([migrate to Postman CLI](https://learning.postman.com/docs/reference/newman-cli/migrate-to-postman-cli.md)). This repo **does not** depend on Newman.

### Audit pack (recommended for complex audits)

With Console already listening:

```bash
bash scripts/run-postman-audit-pack.sh
# Optional MCP HTTP:
bash scripts/run-postman-audit-pack.sh --with-mcp
```

### Manual / App import

1. Import one or more files from `collections/` into Postman.
2. Import one environment from `environments/` and select it in the environment picker.
3. Run `AIOS - Smoke Tests` first.
4. Run `AIOS - Functional Tests` only in an isolated local/test environment.
5. Run `AIOS - Negative Tests` to verify documented error contracts (includes content-hygiene reject on `memory_remember`).
6. Run `AIOS - Regression Tests` for stable contracts.
7. Run `AIOS - Workflows` to validate request chaining.
8. Run `AIOS - MCP HTTP` only after starting the opt-in MCP HTTP server.

`memory_remember` writes to the local memory store on success. Treat Functional `FUNC-011` as a state-changing request and do not run it against production without explicit approval. `provider_ping` may require a reachable Ollama provider and can therefore legitimately report an unhealthy provider while the Console API itself is available.

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

**CI:** do **not** add this pack to the default `quality` job (services must be live; Resource-Aware). Use local / opt-in / audit sessions after `ok infra`.

## Traceability

| Test ID range    | Surface                                                            | Source of truth                                      | Collection |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------------------- | ---------- |
| `SMOKE-001..004` | Console health/status/metrics and MCP health                       | `apps/console/src/server.ts`, `apps/mcp/src/http.ts` | Smoke      |
| `FUNC-001..011`  | Console safe actions                                               | `apps/console/src/actions.ts`                        | Functional |
| `NEG-001..007`   | Validation, parse, 404, MCP 405, memory content hygiene            | console + MCP HTTP + ADR-0033                        | Negative   |
| `REG-001..004`   | Contract version, metrics alias, action catalog, MCP contract tool | source handlers, README, existing tests              | Regression |
| `WORKFLOW-001`   | Health -> action discovery -> compile -> operational state         | Console API synchronous action contract              | Workflows  |
| `MCP-001..006`   | Streamable HTTP lifecycle and stateless method behavior            | `apps/mcp/src/http.ts`, `apps/mcp/README.md`         | MCP HTTP   |

Coverage is measured against discovered HTTP surfaces. CLI, MCP stdio, engines, packages, and plugins are `N/A` here because they do not expose HTTP endpoints.

## Known limitations

- There is no HTTP authentication contract in the current handlers, so the collections intentionally do not invent authorization headers.
- MCP HTTP is opt-in and stateless. The server currently returns `405` for GET and DELETE on `/mcp`; the collection records that behavior rather than assuming session management.
- The current functional suite invokes all safe actions, but provider health depends on an available Ollama service.
- `memory_remember` is a state-changing request on success and is not production-safe; `NEG-007` asserts fail-closed rejection without writing.
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

Example single-collection run (Postman CLI):

```bash
postman collection run integrations/postman/collections/AIOS\ -\ Smoke\ Tests.postman_collection.json \
  --environment integrations/postman/environments/aios.local.postman_environment.json
```

## References

- [Postman CLI overview](https://learning.postman.com/docs/postman-cli/postman-cli-overview/)
- [Run a collection (Postman CLI)](https://learning.postman.com/docs/postman-cli/postman-cli-run-collection.md)
- [Migrate Newman → Postman CLI](https://learning.postman.com/docs/reference/newman-cli/migrate-to-postman-cli.md)
- [Postman collection creation](https://learning.postman.com/docs/use/use-collections/create-collections.md)
- [Postman environment variables](https://learning.postman.com/docs/use/send-requests/variables/variables/)
- [MCP Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports/)
- [MCP lifecycle](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle/)
- [ADR-0033 untrusted content hygiene](../../docs/adr/0033-untrusted-content-hygiene.md)
