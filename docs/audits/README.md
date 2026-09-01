# Audits

Point-in-time engineering and documentation audits. **Not** product SSOT — foundation remains [`../FOUNDATION.md`](../FOUNDATION.md).

## Lifecycle

| Kind                                         | Where                                                                           | Date in filename?                 |
| -------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------- |
| Living index                                 | this `README.md`                                                                | No — Git holds history            |
| Audit snapshot / evidence                    | `docs/audits/<topic>-YYYY-MM.md` (or `YYYY-MM-DD` when the day is the identity) | Yes — the report is a frozen pass |
| Architectural decision that follows an audit | [`docs/adr/`](../adr/)                                                          | No — use the next ADR number      |
| Delivery status                              | [`docs/ROADMAP.md`](../ROADMAP.md) · CHANGELOG · SemVer tags                    | No                                |

Do not rename a dated snapshot to an undated living name. A later pass is a **new** dated file (or an update of this index), not a silent overwrite. Do not use `final` / `latest` / `v2` in the filename as versioning.

| Report                                                                                                        | Date    |
| ------------------------------------------------------------------------------------------------------------- | ------- |
| [Document rationalization](./document-rationalization-audit-2026-08.md)                                       | 2026-08 |
| [Agent runtime evolution](./agent-runtime-evolution-analysis-2026-08.md)                                      | 2026-08 |
| [Product & purpose integral validation](./product-purpose-integral-validation-audit-2026-08.md)               | 2026-08 |
| [Product & purpose integral validation — diagrams](./product-purpose-integral-validation-diagrams-2026-08.md) | 2026-08 |
