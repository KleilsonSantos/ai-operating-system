# @aios/policy — Policy Engine

Regras fixas da plataforma — **policies > prompts longos**.

## Fase 1

| API | Papel |
| --- | --- |
| `loadPolicies(options?)` | Defaults + JSON opcional (`policies/aios.policies.json`, `AIOS_POLICIES_PATH` ou `configPath`) |
| `applyPolicies(rules)` | Constraints + `mustIds` para injeção no workflow |
| `mergePolicies(base, overlay)` | Overlay por `id` |

```ts
import { loadPolicies, applyPolicies } from '@aios/policy'
import { runWorkflow } from '@aios/orchestration'

const bundle = loadPolicies()
const applied = applyPolicies(bundle.rules)
await runWorkflow(intent, { policies: bundle.rules })
// agents recebem refs `policy:<id>` + finding `policies.injected`
```

Defaults embutidos espelham a pedra base (`official-docs`, `trade-offs`, `no-overengineering`, `justify-decisions`, `no-abandoned-libs`).

Formato do arquivo:

```json
{
  "policies": [
    { "id": "…", "description": "…", "severity": "must" | "should" | "may" }
  ]
}
```

## Testes

```bash
pnpm --filter @aios/policy test
```

Fluxo: [system-guide](../../docs/architecture/system-guide.md).
