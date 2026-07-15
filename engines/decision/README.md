# @aios/decision — Decision Engine

Decide quais plugins participam do workflow, por `IntentKind`.

## Matriz (#8 · v2 #63)

| Intent | Agents |
| --- | --- |
| `analyze.project` | architecture · appsec · docs · qa |
| `implement.feature` | architecture · appsec · docs · qa |
| `explain.code` | architecture · docs |
| `review.change` | architecture · appsec · qa |
| `fix.bug` | architecture · appsec · qa |
| `unknown` | _(nenhum)_ |

```ts
import { shouldRunAgent, agentsForIntent } from '@aios/decision'

shouldRunAgent('appsec', 'explain.code') // false
agentsForIntent('fix.bug') // ['architecture','appsec','qa']
```

```bash
pnpm --filter @aios/decision test
```
