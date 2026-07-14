# @aios/pipeline — contrato do núcleo

Porta estável para CLI e integradores (`runPipeline`).

```ts
import { runPipeline } from '@aios/pipeline'

const response = await runPipeline({
  input: 'Analise meu projeto.',
  repoPath: process.cwd(),
  scope: 'engines/policy', // opcional
})
// response.contractVersion === '1'
```

- Tipos: `PipelineRequest` / `PipelineResponse` em `@aios/shared`
- Não embutir engines em outros monorepos — use este pacote ([ADR-0003](../../docs/adr/0003-pipeline-integration-contract.md))

```bash
pnpm --filter @aios/pipeline test
pnpm --filter @aios/cli dev -- "Analise meu projeto."
```
