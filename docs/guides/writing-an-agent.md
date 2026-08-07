# Writing an Agent

> Phase 5 · [ADR-0023](../adr/0023-agent-registry-marketplace.md) · scaffold: [`@aios-platform/create-agent`](../../packages/create-agent/)

AIOS treats agents as **plugins**. You do not call them as the primary UX. The user sends an intent; Intent → Workflow → Orchestration selects agents → Quality Gate → response.

This guide covers packaging a reusable agent that the [Agent Registry](../../packages/agent-registry/) can discover and validate.

## Concept

| Idea                          | Meaning                                                                   |
| ----------------------------- | ------------------------------------------------------------------------- |
| Manifest                      | `agent.yaml` (or `.json`) — name, version, I/O ports, dependencies        |
| Package                       | npm-style folder with `src/`, tests, and the manifest at the package root |
| Built-in agents               | Shipped in this monorepo (Architecture, AppSec, Docs, QA)                 |
| Local / npm / git / community | Additional sources resolved by `@aios-platform/agent-registry`            |

## Anatomy

Minimal layout (produced by the scaffolder):

```text
agent-my-security/
├── agent.yaml
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts
    └── index.test.ts
```

### Manifest (`agent.yaml`)

Required fields: `name`, `version` (semver). Optional: `displayName`, `description`, `inputs`, `outputs`, `dependencies`, `metadata`.

Schema: [`packages/agent-registry/schema/agent.schema.json`](../../packages/agent-registry/schema/agent.schema.json).

Example:

```yaml
name: '@aios/agent-my-security'
version: '0.1.0'
displayName: 'My Security'
description: 'Reviews common AppSec signals for a repository intent'
inputs:
  intent:
    type: string
    required: true
outputs:
  result:
    type: object
dependencies:
  engines:
    - context
metadata:
  tags: [appsec, scaffold]
  maintainer: local
```

Validate with:

```ts
import { AgentRegistry } from '@aios-platform/agent-registry';

const registry = new AgentRegistry();
const manifest = await registry.parseManifest('./agent.yaml');
console.log(registry.validate(manifest));
```

## Scaffold

Preferred (after packages are on npm):

```bash
npm create @aios-platform/agent@latest -- --name my-security
cd agent-my-security
npm install
npm test
```

From this monorepo (no npm publish required):

```bash
pnpm --filter @aios-platform/create-agent dev -- --name my-security
cd agent-my-security
pnpm install
pnpm test
```

Maintainers: publish both packages with `bash scripts/npm-publish-create-agent.sh` (see [Publish create-agent](./publish-create-agent.md)). Local pack smoke: `bash scripts/smoke-create-agent-pack.sh`.

## I/O contract

- **Inputs** declare what orchestration may pass (keep types simple: `string`, `object`, …).
- **Outputs** declare the shape of the agent result.
- Implementation should fail fast on missing required inputs.

The scaffolded `run(input)` function is a stub. Wire it to engines (context, policy, …) or providers only through AIOS contracts — do not reimplement Policy / Memory / Knowledge inside the agent (ADR-0014).

## Testing

- Unit-test `run()` with Node’s test runner or Vitest.
- Re-validate `agent.yaml` whenever you change the manifest.
- Later (Phase 5b observability): execution metrics land via orchestration hooks — agents stay unaware of JSONL details.

## Debugging

1. `AgentRegistry.validate` — schema errors before runtime.
2. `aios list-agents` / MCP `aios_list_agents` — confirm discovery (local path / tags).
3. Keep prompts short; permanent rules belong in `policies/`, not in agent copy-paste.

## Publish

See [Publish an Agent](./publish-an-agent.md) for the GitHub topic `aios-agent`, weekly ingest, and community catalog stubs. To publish the scaffolder itself to npm, see [Publish create-agent](./publish-create-agent.md).
