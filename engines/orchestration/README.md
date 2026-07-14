# @aios/orchestration — Orchestration Engine

Coordena Decision → plugins → injeção de policies/context.

```ts
const { results, ran, skipped } = await runWorkflow(intent, {
  policies,
  context,
})
```

Plugins são **plugins** — o usuário não os escolhe; a matriz do Decision agenda.

Issue #8 · [system-guide](../../docs/architecture/system-guide.md)
