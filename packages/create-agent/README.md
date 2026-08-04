# @aios/create-agent

Scaffold a new AIOS agent package (Phase 5b / [ADR-0023](../../docs/adr/0023-agent-registry-marketplace.md)).

## Usage (monorepo)

```bash
pnpm --filter @aios/create-agent dev -- --name my-security
# → ./agent-my-security with agent.yaml, src/, tests, README
```

When published to npm:

```bash
npm create @aios/agent@latest -- --name my-security
```

## API

```ts
import { scaffoldAgent } from '@aios/create-agent';

await scaffoldAgent({ name: 'my-security', targetDir: './agent-my-security' });
```

## Guide

[Writing an Agent](../../docs/guides/writing-an-agent.md)
