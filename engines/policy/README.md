# @aios/policy — Policy Engine

Fixed platform rules — **policies > long prompts**.

## Phase 1

| API                            | Role                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `loadPolicies(options?)`       | Defaults + optional JSON (`policies/aios.policies.json`, `AIOS_POLICIES_PATH`, or `configPath`) |
| `applyPolicies(rules)`         | Constraints + `mustIds` for workflow injection                                                  |
| `mergePolicies(base, overlay)` | Overlay by `id`                                                                                 |

```ts
import { loadPolicies, applyPolicies } from '@aios/policy';
import { runWorkflow } from '@aios/orchestration';

const bundle = loadPolicies();
const applied = applyPolicies(bundle.rules);
await runWorkflow(intent, { policies: bundle.rules });
// agents receive `policy:<id>` refs + finding `policies.injected`
```

Built-in defaults mirror the foundation (`official-docs`, `trade-offs`, `no-overengineering`, `justify-decisions`, `no-abandoned-libs`).

File format:

```json
{
  "policies": [
    { "id": "…", "description": "…", "severity": "must" | "should" | "may" }
  ]
}
```

## Tests

```bash
pnpm --filter @aios/policy test
```

Flow: [system-guide](../../docs/architecture/system-guide.md).
