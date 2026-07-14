# @aios/cli

Cliente fino do núcleo AIOS. stdout = `PipelineResponse` (`contractVersion: "1"`).

```bash
pnpm --filter @aios/cli dev -- "Analise meu projeto."
pnpm --filter @aios/cli dev -- --scope=engines/policy "Analise meu projeto."
pnpm --filter @aios/cli dev -- --repo=/path/to/project "Review this PR"
pnpm --filter @aios/cli dev -- --contract-version
```

| Flag / env | Papel |
| --- | --- |
| `--scope` / `AIOS_SCOPE` | Escopo Context |
| `--repo` / `AIOS_REPO` | Raiz do repositório alvo |
| `--policies` / `AIOS_POLICIES_PATH` | JSON de policies |
| `--contract-version` | Imprime `1` e sai |

Exit `1` se `verdict.passed === false`.

API programática: `import { runPipeline } from '@aios/pipeline'` — [ADR-0003](../../docs/adr/0003-pipeline-integration-contract.md).
