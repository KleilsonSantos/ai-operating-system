# @aios/cli

Thin client for the AIOS core. stdout = `PipelineResponse` (`contractVersion: "1"`).

```bash
pnpm --filter @aios/cli dev -- "Analise meu projeto."
pnpm --filter @aios/cli dev -- --scope=engines/policy "Analise meu projeto."
pnpm --filter @aios/cli dev -- --repo=/path/to/project "Review this PR"
pnpm --filter @aios/cli dev -- --contract-version
```

| Flag / env | Role |
| --- | --- |
| `--scope` / `AIOS_SCOPE` | Context scope |
| `--repo` / `AIOS_REPO` | Target repository root |
| `--policies` / `AIOS_POLICIES_PATH` | Policies JSON |
| `--contract-version` | Prints `1` and exits |

Exit `1` if `verdict.passed === false`.

Programmatic API: `import { runPipeline } from '@aios/pipeline'` — [ADR-0003](../../docs/adr/0003-pipeline-integration-contract.md).
