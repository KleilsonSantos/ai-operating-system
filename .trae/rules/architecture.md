---
description: Use for product scope, architecture, engine boundaries, ADR, and roadmap questions in AIOS
alwaysApply: false
---

# Architecture and Product Scope

When the task affects architecture, product boundaries, or engine responsibilities, use these sources first:

- [`docs/FOUNDATION.md`](../../docs/FOUNDATION.md)
- [`docs/VISION.md`](../../docs/VISION.md)
- [`docs/architecture/overview.md`](../../docs/architecture/overview.md)
- [`docs/architecture/system-guide.md`](../../docs/architecture/system-guide.md)
- [`docs/ROADMAP.md`](../../docs/ROADMAP.md)
- [`docs/adr/`](../../docs/adr/)

## Interpretation Rules

- The foundation wins over summaries until an ADR changes the decision.
- AIOS is a standalone product.
- Agents are plugins and should not dominate the primary UX.
- Follow the roadmap phase before introducing new engines or expanding scope.
