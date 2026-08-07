# Publish `@aios/create-agent` (npm)

> Phase 5b · Issue [#233](https://github.com/KleilsonSantos/ai-operating-system/issues/233) · [ADR-0023](../adr/0023-agent-registry-marketplace.md)

This guide is for **maintainers** publishing the scaffolder so anyone can run:

```bash
npm create @aios/agent@latest -- --name my-agent
```

(`npm create @aios/agent` resolves to the `@aios/create-agent` package and runs its `create-agent` bin.)

## Prerequisites

1. npm account with **publish** rights on the `@aios` organization.
2. `npm login` (or `NPM_TOKEN` configured for the registry).
3. Node `>=22.13`, pnpm via the repo `packageManager` field.
4. Packages already on `main` (or the commit you intend to publish).

## Package order

`@aios/create-agent` depends on `@aios/agent-registry`. Publish **registry first**, then create-agent.

The template lives **inside** `@aios/create-agent` (`template/`). A separate `@aios/agent-template` package is optional and deferred.

## Dry-run / local smoke

```bash
# Pack both tarballs, install locally, run create-agent bin (no npm auth)
bash scripts/smoke-create-agent-pack.sh

# Simulate publish metadata without uploading
bash scripts/npm-publish-create-agent.sh --dry-run
```

## Publish

```bash
bash scripts/npm-publish-create-agent.sh
```

Equivalent manual steps:

```bash
pnpm --filter @aios/agent-registry publish --access public --no-git-checks
pnpm --filter @aios/create-agent publish --access public --no-git-checks
```

`pnpm publish` rewrites `workspace:*` dependencies to the concrete version in the tarball.

## Verify

```bash
npm view @aios/create-agent version
npm create @aios/agent@latest -- --name verify-smoke
```

## Notes

- Both packages use `publishConfig.access: public` (scoped packages default to restricted).
- Version bumps follow SemVer release aggregation (`docs/guides/releases.md`) — do not publish ad-hoc versions off feature branches without a release plan.
- Resource-Aware: prefer dry-run + pack smoke before a real publish; no extra CI publish job until the org token is ready.
