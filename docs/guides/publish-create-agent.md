# Publish `@aios-platform/create-agent` (npm)

> Phase 5b · Issues [#233](https://github.com/KleilsonSantos/ai-operating-system/issues/233) · [#325](https://github.com/KleilsonSantos/ai-operating-system/issues/325) · [ADR-0023](../adr/0023-agent-registry-marketplace.md)

> **Scope note:** the npm organization `aios` is not available. Public packages ship under **`@aios-platform`**. Workspace packages elsewhere may still use the `@aios/*` name until migrated.

This guide is for **maintainers** publishing the scaffolder so anyone can run:

```bash
npm create @aios-platform/agent@latest -- --name my-agent
```

(`npm create @aios-platform/agent` resolves to the `@aios-platform/create-agent` package and runs its `create-agent` bin.)

## Prerequisites

1. npm account with **publish** rights on the **`@aios-platform`** scope.
2. Auth (pick one):
   - `TOKEN_NPM` in repo-root `.env` (read by `scripts/npm-publish-create-agent.sh`), or
   - `npm login` / interactive OTP via `bash scripts/npm-publish-create-agent.sh --otp=######`
3. Node `>=22.13`, pnpm via the repo `packageManager` field.
4. Packages already on `main` at the SemVer you intend to publish (aggregate releases — do not invent ad-hoc versions).

## Package order

`@aios-platform/create-agent` depends on `@aios-platform/agent-registry`. Publish **registry first**, then create-agent.

The template lives **inside** `@aios-platform/create-agent` (`template/`). A separate `@aios/agent-template` package is optional and deferred.

## Dry-run / local smoke

```bash
# Pack both tarballs, install locally, run create-agent bin (no npm auth)
bash scripts/smoke-create-agent-pack.sh

# Simulate publish metadata without uploading
bash scripts/npm-publish-create-agent.sh --dry-run
```

## Publish (SemVer catch-up)

After a release on `main` (e.g. `v0.47.0`), npm may still show an older version until maintainers publish:

```bash
git checkout main && git pull
npm view @aios-platform/agent-registry version   # often lags monorepo
bash scripts/smoke-create-agent-pack.sh
bash scripts/npm-publish-create-agent.sh --dry-run
bash scripts/npm-publish-create-agent.sh          # or --otp=###### if 2FA
npm view @aios-platform/agent-registry version
npm view @aios-platform/create-agent version
```

Equivalent manual steps:

```bash
pnpm --filter @aios-platform/agent-registry publish --access public --no-git-checks
pnpm --filter @aios-platform/create-agent publish --access public --no-git-checks
```

`pnpm publish` rewrites `workspace:*` dependencies to the concrete version in the tarball.

## Verify

```bash
npm view @aios-platform/create-agent version
npm create @aios-platform/agent@latest -- --name verify-smoke
```

## Auth troubleshooting

| Symptom                                       | Likely cause                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `401 Unauthorized` on `npm whoami` / publish  | Expired or revoked `TOKEN_NPM`; regenerate a **publish**-capable token    |
| `404 Not Found` on `PUT …/@aios-platform%2f…` | Often auth failure disguised as 404 for scoped packages — fix token first |
| 2FA challenge                                 | Classic tokens: pass `--otp=######` to the publish script                 |

Do not commit tokens. Prefer a granular npm token limited to `@aios-platform` publish.

## Notes

- Both packages use `publishConfig.access: public` (scoped packages default to restricted).
- Version bumps follow SemVer release aggregation (`docs/guides/releases.md`) — do not publish ad-hoc versions off feature branches without a release plan.
- Resource-Aware: prefer dry-run + pack smoke before a real publish; no extra CI publish job until the org token is ready.
