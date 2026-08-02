---
description: Use for CI, local hooks, Sonar, CodeQL, coverage, lint, and merge-blocking quality gates
alwaysApply: false
---

# Quality Gates and Automation

For code quality gates and merge blocking, use these sources together:

- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- [`package.json`](../../package.json)
- [`.githooks/pre-commit`](../../.githooks/pre-commit)
- [`.githooks/pre-push`](../../.githooks/pre-push)
- [`sonar-project.properties`](../../sonar-project.properties)
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
- [`policies/aios.policies.json`](../../policies/aios.policies.json)

## Expectations

- Local hooks should catch avoidable failures before push.
- Required GitHub workflows must pass before merge.
- Vulnerability, lint, typecheck, test, and coverage gates should stay aligned between local and remote execution.
- Prefer free, maintained tooling already used by the repository unless a documented gap remains.

## SonarQube Cloud (Free plan)

This organization uses the **SonarQube Cloud Free** plan. Official limits:

- **Branch analysis:** main branch only — not `sandbox`, `feature/*`, or other long-lived branches.
- **Pull request analysis:** only when the PR **target** is `main` (Team/Enterprise unlock unlimited branch/PR analysis).

Therefore the `sonarcloud` job in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs only on `push` to `main`. Do **not** enable Sonar on every PR or on `sandbox` integrations under Free — that is unsupported and will confuse CI.

The optional **Quality Gate wait** step on `main` (scan vs `sonarqube-quality-gate-action`) is separate from this scope rule. Scan-on-main stays; restoring a blocking QG wait requires a green gate on `main`, not branch coverage.

Refs: [Subscription plans](https://docs.sonarsource.com/sonarqube-cloud/administering-sonarcloud/managing-subscription/subscription-plans) · [Branch analysis](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/branch-analysis/branch-analysis) · issue #181.
