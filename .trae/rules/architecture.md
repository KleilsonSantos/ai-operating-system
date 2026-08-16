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
- Before creating a file or directory: domain, canonical location, lifecycle, and consumer — reuse an existing artifact when it already fulfills the purpose (`artifact-lifecycle`).
- Living docs use a stable name. Date in a filename only for snapshots under `docs/audits/` (or incident/evidence). `.github/modernize/` plans are historical; ROADMAP + ADRs win.
- Model routing selects a capability class (`fast` | `coding` | `reasoning` | `arbitration`), never a vendor (`model-route-by-capability` / ADR-0025).
- Skills are packs for the Prompt Engine (`skills-are-packs` / ADR-0026). Default is none. Do not invent a new agent or hook bus for a skill.
