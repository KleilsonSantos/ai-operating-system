# @aios-platform/agent-template

Canonical **agent package template** for AIOS (Phase 5b / ADR-0023 / #532).

`@aios-platform/create-agent` scaffolds from these files via `resolveTemplateDir()`. Filenames match the generated package (create-vite / Yeoman style — no `.tmpl` suffix). Content tokens: `{{PACKAGE_NAME}}`, `{{MANIFEST_NAME}}`, `{{DISPLAY_NAME}}`, `{{DESCRIPTION}}`, `{{VERSION}}`. Dotfiles, if added later, prefer `_gitignore` → `.gitignore` (same as create-vite). Vitest excludes `template/` so scaffold copies are not treated as this package’s tests.

> npm org `aios` is unavailable — public packages use **`@aios-platform`**.

## API

```ts
import { resolveTemplateDir } from '@aios-platform/agent-template';

const templateDir = resolveTemplateDir();
```

## Develop

```bash
pnpm --filter @aios-platform/agent-template test
pnpm --filter @aios-platform/agent-template build
```

Guide: [Writing an Agent](../../docs/guides/writing-an-agent.md) · [Publish create-agent](../../docs/guides/publish-create-agent.md)
