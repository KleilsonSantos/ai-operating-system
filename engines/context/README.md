# @aios/context — Context Engine

Recupera docs e código relevantes do repositório (heurística por path — Fase 1).

## Uso

```ts
import { gatherContext } from '@aios/context'

const bundle = gatherContext({
  repoPath: process.cwd(),
  scope: 'engines/policy', // opcional
})
// { repoPath, scope, snippets: [{ path, kind, content, bytes }], signals }
```

CLI:

```bash
pnpm --filter @aios/cli dev -- --scope=engines/policy "Analise meu projeto."
# ou: AIOS_SCOPE=apps/cli pnpm --filter @aios/cli dev -- "…"
```

## Contrato

| Campo | Papel |
| --- | --- |
| `scope` | Escopo relativo à raiz (aceite #7) |
| `snippets` | Bundle tipado (`doc` / `code` / `manifest`) |
| orchestration | `runWorkflow(intent, { context })` injeta `context:<path>` |

Ignora `node_modules`, `dist`, `.git`, etc. Caps: snippets / bytes por arquivo / total.

## Testes

```bash
pnpm --filter @aios/context test
```
