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
