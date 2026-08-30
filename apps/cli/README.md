# @aios/cli

Thin client for the AIOS core. stdout = `PipelineResponse` (`contractVersion: "1"`).

Set **`AIOS_HOME`** to the monorepo root when using `pnpm --filter @aios/cli` (cwd may be `apps/cli`). Needed for policies, memory, governance, metrics, and visibility.

```bash
export AIOS_HOME=/path/to/ai-operating-system
pnpm --filter @aios/cli dev -- "Analise meu projeto."
pnpm --filter @aios/cli dev -- --scope=engines/policy "Analise meu projeto."
pnpm --filter @aios/cli dev -- --repo=/path/to/project "Review this PR"
pnpm --filter @aios/cli dev -- --list-agents --json
pnpm --filter @aios/cli dev -- --contract-version
```

| Flag / env                          | Role                                            |
| ----------------------------------- | ----------------------------------------------- |
| `AIOS_HOME`                         | Monorepo root (policies, memory, governance, …) |
| `--scope` / `AIOS_SCOPE`            | Context scope                                   |
| `--repo` / `AIOS_REPO`              | Target repository root                          |
| `--policies` / `AIOS_POLICIES_PATH` | Policies JSON                                   |
| `--list-agents`                     | List Agent Registry agents                      |
| `--json` / `--agents-json`          | With `--list-agents`, machine-readable JSON     |
| `--contract-version`                | Prints `1` and exits                            |

Exit `1` if `verdict.passed === false`.

Programmatic API: `import { runPipeline } from '@aios/pipeline'` — [ADR-0003](../../docs/adr/0003-pipeline-integration-contract.md).
