# @aios/cli

Cliente mínimo do AIOS. Integradores consomem a orquestração via CLI/API.

```bash
pnpm --filter @aios/cli dev -- "Analise meu projeto."
pnpm --filter @aios/cli dev -- --scope=engines/policy "Analise meu projeto."
```

`--scope` (ou `AIOS_SCOPE`) limita a coleta do Context Engine a um path relativo à raiz do monorepo.
