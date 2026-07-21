# @aios/quality-gate — Quality Gate

Validates the results package **before** treating the response as OK.

## Checks (#8)

With `evaluateQuality(results, { intent, context })`:

| Check               | Fails when                              |
| ------------------- | --------------------------------------- |
| `agentsOk`          | any `ok: false`                         |
| `agentsScheduled`   | missing agent from the intent matrix    |
| `nonEmptyRun`       | known intent with no results            |
| `contextPresent`    | `analyze.project` with no snippets      |
| `policiesInjected`  | missing `policies.injected` in findings |
| `hasDomainFindings` | only meta-findings (policies/context)   |

CLI: `process.exitCode = 1` if `!verdict.passed`.

```bash
pnpm --filter @aios/quality-gate test
```
