# @aios/quality-gate — Quality Gate

Valida o pacote de resultados **antes** de considerar a resposta OK.

## Checks (#8)

Com `evaluateQuality(results, { intent, context })`:

| Check | Falha quando |
| --- | --- |
| `agentsOk` | algum `ok: false` |
| `agentsScheduled` | falta agent da matriz do intent |
| `nonEmptyRun` | intent conhecido sem results |
| `contextPresent` | `analyze.project` sem snippets |
| `policiesInjected` | falta `policies.injected` nos findings |
| `hasDomainFindings` | só meta-findings (policies/context) |

CLI: `process.exitCode = 1` se `!verdict.passed`.

```bash
pnpm --filter @aios/quality-gate test
```
