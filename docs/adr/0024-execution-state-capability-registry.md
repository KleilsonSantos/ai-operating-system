# ADR-0024: Execution state, capability allowlist, registry-selected plugins

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** Kleilson dos Santos
- **Issue:** #261

## Context

AIOS already has a governed spine (`runPipeline` → intent → policy → context → orchestration → quality gate) and an Agent Registry for discovery (ADR-0023). Three gaps blocked a thin execution contract:

1. No first-class Run/Step record on `PipelineResponse`
2. MCP `aios_*` tools were not privilege-scoped
3. Orchestration hardcoded four plugins and never asked the registry

The product must stay a **control plane**, not a coding-agent loop.

## Decision

1. **Execution state (additive).** `PipelineResponse.run` (`PipelineRun` / `PipelineStep`) is always populated by `runPipeline`. `contractVersion` stays `"1"`.
2. **Capability allowlist.** Each MCP tool has a `Privilege`. Caller privilege comes from `AIOS_MCP_PRIVILEGE` (default `CONTROLLED_EXECUTION`). The model cannot pick privilege via tool arguments. `PRIVILEGED` also requires `AIOS_MCP_ALLOW_PRIVILEGED=1`. Unknown tools fail closed.
3. **Policy-backed SAFE_WRITE consent (#378).** Must-policy `mcp-safe-write-consent` (in `policies/aios.policies.json`) gates `aios_memory_clear` and `aios_export_obsidian`: they require `AIOS_MCP_ALLOW_SAFE_WRITE=1`. Privilege alone is not enough when that must-policy is loaded. CLI `--export-obsidian` uses the same `authorizeMcpTool` check (no MCP bypass).
4. **Registry-selected plugins.** Orchestration intersects Agent Registry names with known runners (`architecture` / `appsec` / `docs` / `qa`). Opt-in via `pluginSource: "registry"` or `AIOS_REGISTRY_PLUGINS=1`. Empty or failed selection falls back to the four builtin plugins (ADR-0023 backcompat). Community catalog entries are not executed.

## Consequences

### Positive

- Governance can answer who/what/why per pipeline run
- MCP write/destructive tools are deny-by-default at higher privilege
- Registry discovery can influence scheduling without a second orchestrator

### Trade-offs

- Registry mode still only _runs_ agents that already have in-process runners
- Privilege is process-wide (env), not per-session RBAC

## Rejected alternatives

| Option                             | Reason                                      |
| ---------------------------------- | ------------------------------------------- |
| New runtime / workflow engine      | Duplicates `@aios/pipeline` + orchestration |
| Coding-agent loop in core          | Companion/IDE concern (ADR-0014)            |
| Dynamic import of community agents | Unsandboxed execution; fail closed          |
| Bump `contractVersion`             | Additive field only                         |

## References

- [ADR-0003](./0003-pipeline-integration-contract.md)
- [ADR-0023](./0023-agent-registry-marketplace.md)
- Audit: [`docs/audits/agent-runtime-evolution-analysis-2026-08.md`](../audits/agent-runtime-evolution-analysis-2026-08.md)
