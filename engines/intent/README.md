# @aios/intent — Intent Engine

Interprets the user request into a typed `Intent`.

## Phase 1

**Heuristic** classification (rules):

| `kind`            | Examples                           |
| ----------------- | ---------------------------------- |
| `analyze.project` | “Analise meu projeto.”             |
| `explain.code`    | “Explain how this module works.”   |
| `review.change`   | “Review this pull request.”        |
| `unknown`         | No clear signals / below threshold |

```ts
import { resolveIntent } from '@aios/intent';

const intent = resolveIntent('Analise meu projeto.');
// { kind: 'analyze.project', confidence: 0.8, signals: [...], raw: '...' }
```

LLM / prompt-engine comes in a later phase — this engine remains the entry port of the flow ([system-guide](../../docs/architecture/system-guide.md)).

## Tests

```bash
pnpm --filter @aios/intent test
```
