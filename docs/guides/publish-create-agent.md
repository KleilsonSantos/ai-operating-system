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
2. Auth (see [Auth troubleshooting](#auth-troubleshooting) — **do not** assume “token expired” from the npm UI alone):
   - **Preferred:** `TOKEN_NPM` in repo-root `.env` (granular access token with **Publish** on `@aios-platform`; script uses this **before** any `npm login` session).
   - **Fallback:** `npm login` + OTP: `bash scripts/npm-publish-create-agent.sh --otp=######` (only when `.env` has no `TOKEN_NPM`).
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

### How the publish script chooses credentials

```text
scripts/npm-publish-create-agent.sh
        │
        ├─ TOKEN_NPM in .env?  ──yes──► use token (ignores npm login session)
        │
        └─ no TOKEN_NPM        ──► use ~/.npmrc from npm login (+ --otp if 2FA)
```

**Implication:** `npm whoami` succeeding after `npm login` does **not** prove publish will work — and it does **not** prove `TOKEN_NPM` is bad. Always test with the **same path** you will use to publish:

```bash
bash scripts/npm-publish-create-agent.sh --dry-run   # uses TOKEN_NPM when present
```

### Symptom matrix (read before regenerating tokens)

| Symptom                                                                         | Auth path in use                                                   | Likely cause                                                                                                 | What to do                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `401 Unauthorized` on publish **via script** (`Using TOKEN_NPM from .env`)      | GAT in `.env`                                                      | Wrong value in `.env` (typo, old copy), revoked token, or missing **Publish** permission on `@aios-platform` | Fix `.env` or edit token permissions on npm; confirm prefix/suffix match the npm UI |
| `401` only on raw `npm whoami` **without** script                               | ad-hoc / wrong config                                              | Not using the token the script would use                                                                     | Run dry-run via script instead of guessing                                          |
| `403` + “Two-factor authentication … required to publish”                       | **`npm login` session** (no `TOKEN_NPM`, or manual `pnpm publish`) | Interactive login does **not** bypass publish 2FA                                                            | Use `TOKEN_NPM` with bypass-2FA GAT **or** pass `--otp=######` to the script        |
| Token **valid** on npm UI (future expiry, “Last used” recent) but publish fails | GAT                                                                | Granular token lacks **Publish** / wrong scope — expiry date is not the only check                           | npm → Access Tokens → edit → Packages: Read and write on `@aios-platform`           |
| `404 Not Found` on `PUT …/@aios-platform%2f…`                                   | either                                                             | Often auth failure disguised as 404 for scoped packages                                                      | Fix auth first (table above), not package name                                      |

**Common false positive:** concluding “token expired” because publish failed after `npm login`, while the npm dashboard still shows a valid GAT. The login path needed OTP; the GAT in `.env` may be fine. Verify with `bash scripts/npm-publish-create-agent.sh --dry-run`.

### GAT bypass-2FA and future npm policy

Granular access tokens with **Bypass 2FA** can publish without `--otp` today. npm is [deprecating bypass-2FA for direct publish](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/) (~2027) in favor of **trusted publishing (OIDC)** or staged publish + human 2FA. Plan OIDC in GitHub Actions before relying on long-lived bypass tokens.

Do not commit tokens. Prefer a granular npm token limited to `@aios-platform` **Publish**.

### Registry catch-up status

| Monorepo tag | `@aios-platform/agent-registry`   | `@aios-platform/create-agent`     |
| ------------ | --------------------------------- | --------------------------------- |
| `v0.48.3`    | **0.48.3** (published 2026-09-02) | **0.48.3** (published 2026-09-02) |

After each release on `main`, run `npm view @aios-platform/agent-registry version` — registry may lag until maintainers run the publish script.

## Notes

- Both packages use `publishConfig.access: public` (scoped packages default to restricted).
- Version bumps follow SemVer release aggregation (`docs/guides/releases.md`) — do not publish ad-hoc versions off feature branches without a release plan.
- Resource-Aware: prefer dry-run + pack smoke before a real publish; automated publish via trusted publishing (OIDC) is deferred — manual catch-up after `green` is the current process.
