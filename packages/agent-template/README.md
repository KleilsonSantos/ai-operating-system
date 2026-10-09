# @aios-platform/agent-template

Canonical scaffold files for AIOS agent packages (Phase 5b leftover / [#532](https://github.com/KleilsonSantos/ai-operating-system/issues/532) · [ADR-0023](../../docs/adr/0023-agent-registry-marketplace.md)).

Consumed by [`@aios-platform/create-agent`](../create-agent/). Not a runtime engine.

## API

```ts
import { resolveTemplateDir } from '@aios-platform/agent-template';

const dir = resolveTemplateDir(); // absolute path to template/
```

## Template tokens

`create-agent` replaces `{{PACKAGE_NAME}}`, `{{MANIFEST_NAME}}`, `{{DISPLAY_NAME}}`, `{{DESCRIPTION}}`, and `{{VERSION}}` in `*.tmpl` files.

## Maintainers

- Publish order: registry → **agent-template** → create-agent — see [Publish create-agent](../../docs/guides/publish-create-agent.md)
