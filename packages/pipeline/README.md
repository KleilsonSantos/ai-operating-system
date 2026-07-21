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
```

- Types: `PipelineRequest` / `PipelineResponse` in `@aios/shared`
- Do not embed engines in other monorepos — use this package ([ADR-0003](../../docs/adr/0003-pipeline-integration-contract.md))

```bash
pnpm --filter @aios/pipeline test
pnpm --filter @aios/cli dev -- "Analise meu projeto."
```
