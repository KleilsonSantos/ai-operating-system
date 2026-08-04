# Security Policy

## Supported versions

| Version           | Supported |
| ----------------- | --------- |
| 0.x (pre-release) | ✅        |

## Reporting a vulnerability

**Do not open public issues for security vulnerabilities.**

Send details to: **kleilson@icloud.com**

Include a description, reproduction steps, impact, and suggested mitigation (if any).

We aim to respond within 5 business days.

## GitHub Security and quality (control-plane hygiene)

AIOS uses GitHub’s Security tab alongside CI gates. Expected posture:

| Feature                         | Posture                      | Notes                                                                  |
| ------------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| Dependabot **alerts**           | **On**                       | CVE visibility in the Security tab; complements `pnpm audit` in CI     |
| Dependabot **security updates** | **Off** (intentional)        | Auto-PRs would target `main`; version bumps go to `sandbox` (git flow) |
| Secret scanning + push protect  | On                           | Block accidental secret commits                                        |
| Code scanning (CodeQL)          | On via CI                    | Triage open alerts; console JSON must not leak `Error.stack`           |
| `pnpm audit`                    | CI `security` job + pre-push | Transitive pins via `pnpm-workspace.yaml` overrides when needed        |

Owner checklist if settings drift: repo **Settings → Code security** — keep alerts on; leave security-update PRs off unless you accept `main`-targeted Dependabot merges.

See also: [`docs/guides/git-workflow.md`](docs/guides/git-workflow.md) (Dependabot section).
