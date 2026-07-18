# @aios/orchestration — Orchestration Engine

Coordinates Decision → plugins → policies/context injection.

```ts
const { results, ran, skipped } = await runWorkflow(intent, {
  policies,
  context,
})
```

Plugins are **plugins** — the user does not choose them; the Decision matrix schedules them.

Issue #8 · [system-guide](../../docs/architecture/system-guide.md)
