# @aios/intent — Intent Engine

Interpreta o pedido do usuário em um `Intent` tipado.

## Fase 1

Classificação **heurística** (regras):

| `kind` | Exemplos |
| --- | --- |
| `analyze.project` | “Analise meu projeto.” |
| `explain.code` | “Explique como funciona este módulo.” |
| `review.change` | “Review this pull request.” |
| `unknown` | Sem sinais claros / abaixo do limiar |

```ts
import { resolveIntent } from '@aios/intent'

const intent = resolveIntent('Analise meu projeto.')
// { kind: 'analyze.project', confidence: 0.8, signals: [...], raw: '...' }
```

LLM / prompt-engine entra em fase posterior — este engine permanece a porta de entrada do fluxo ([system-guide](../../docs/architecture/system-guide.md)).

## Testes

```bash
pnpm --filter @aios/intent test
```
