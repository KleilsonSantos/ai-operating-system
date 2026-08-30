# @aios/pipeline — core contract

Stable port for CLI and integrators (`runPipeline`).

```ts
import { runPipeline } from '@aios/pipeline';

const response = await runPipeline({
  input: 'Analise meu projeto.',
  repoPath: process.cwd(),
  scope: 'engines/policy', // optional
});
// response.contractVersion === '1'
// response.run — execution state (runId, steps, run.model route)
```

- Types: `PipelineRequest` / `PipelineResponse` in `@aios/shared`
- Do not embed engines in other monorepos — use this package ([ADR-0003](../../docs/adr/0003-pipeline-integration-contract.md))
- **Honesty (#377):** `response.capabilities.act` is `false` in default `runPipeline` (heuristic analysis only). Intents that imply write/ACT (`implement.feature`, `fix.bug`) fail the quality gate with blocker `actAvailable` and finding `act.unavailable` — they do **not** mean “code was applied”.

```bash
pnpm --filter @aios/pipeline test
pnpm --filter @aios/cli dev -- "Analise meu projeto."
```
