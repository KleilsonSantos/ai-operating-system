# @aios-platform/create-agent

Scaffold a new AIOS agent package (Phase 5b / [ADR-0023](../../docs/adr/0023-agent-registry-marketplace.md)).

## Usage (npm)

```bash
npm create @aios-platform/agent@latest -- --name my-security
# → ./agent-my-security with agent.yaml, src/, tests, README
```

## Usage (monorepo)

```bash
pnpm --filter @aios-platform/create-agent dev -- --name my-security
```

## API

```ts
import { scaffoldAgent } from '@aios-platform/create-agent';

await scaffoldAgent({ name: 'my-security', targetDir: './agent-my-security' });
```

## Maintainers

- Pack smoke: `bash scripts/smoke-create-agent-pack.sh`
- Publish: [Publish create-agent](../../docs/guides/publish-create-agent.md)

## Guide

[Writing an Agent](../../docs/guides/writing-an-agent.md)
