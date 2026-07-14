# @aios/decision — Decision Engine

Decide quais plugins participam do workflow, por `IntentKind`.

## Matriz Fase 1 (#8)

| Intent | Agents |
| --- | --- |
| `analyze.project` | architecture · appsec · docs · qa |
| `explain.code` | architecture · docs |
| `review.change` | architecture · appsec · qa |
| `unknown` | _(nenhum)_ |

```ts
import { shouldRunAgent, agentsForIntent } from '@aios/decision'

shouldRunAgent('appsec', 'explain.code') // false
agentsForIntent('review.change') // ['architecture','appsec','qa']
```

```bash
pnpm --filter @aios/decision test
```
