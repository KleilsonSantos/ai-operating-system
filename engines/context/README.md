# @aios/context — Context Engine

Retrieves relevant docs and code from the repository (path heuristic + Knowledge Graph neighbors for a non-root `scope` — no embeddings).

## Usage

```ts
import { gatherContext } from '@aios/context';

const bundle = gatherContext({
  repoPath: process.cwd(),
  scope: 'engines/policy', // optional
  // budget: resolveContextBudget({ intentKind: 'analyze.project' }),
});
// { repoPath, scope, snippets: [{ path, kind, content, bytes }], signals, budget }
```

CLI:

```bash
pnpm --filter @aios/cli dev -- --scope=engines/policy "Analise meu projeto."
# or: AIOS_SCOPE=apps/cli pnpm --filter @aios/cli dev -- "…"
```

## Contract

| Field         | Role                                                        |
| ------------- | ----------------------------------------------------------- |
| `scope`       | Scope relative to the root (acceptance #7)                  |
| `snippets`    | Typed bundle (`doc` / `code` / `manifest`)                  |
| orchestration | `runWorkflow(intent, { context })` injects `context:<path>` |

Ignores `node_modules`, `dist`, `.git`, etc. Caps: snippets / bytes per file / total. Named budget tiers (`tight` / `standard` / `wide`) and a secret-path deny list ([ADR-0025](../../docs/adr/0025-model-router-context-budget.md)). When `scope` is a package/engine path, `depends_on` workspace neighbors and matching `docs/adr/*` files are collected and ranked first ([ADR-0005](../../docs/adr/0005-knowledge-graph-heuristic.md)).

## Tests

```bash
pnpm --filter @aios/context test
```
