# ADR-0007: Multi-repo genérico (ops sobre o registry)

- **Status:** Aceito
- **Data:** 2026-07-14
- **Decisores:** Kleilson dos Santos
- **Issue:** #55

## Contexto

Fase 2 entregou registry + resolve (ADR-0004). Fase 3 pede **multi-repo genérico**: qualquer workspace registrado deve ser operável pelo mesmo núcleo (CRUD no registry, health-check, pipeline em lote) — sem assumir o monorepo AIOS.

## Decisão

1. Estender `@aios/workspace`: `upsertWorkspace` · `removeWorkspace` · `validateWorkspace` · `listValidatedWorkspaces`.
2. `WorkspaceEntry.tags?` para classificação leve.
3. `@aios/pipeline.runAcrossWorkspaces({ input, workspaceIds? })` → resumos por workspace.
4. MCP: `aios_workspace_upsert` · `aios_workspace_remove` · `aios_workspace_validate` · `aios_run_across_workspaces`.
5. Validação “ok” = path existe + diretório + (`.git` **ou** `package.json` **ou** marker de monorepo/docs).
6. `contractVersion` permanece `"1"`.

## Consequências

### Positivas

- Onboarding de um segundo repo = upsert + validate
- Mesma Governança / KG / Memory por `workspaceId`

### Negativas / trade-offs

- Sem clone remoto / auth nesta fatia
- Batch é sequencial (simplicidade)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Discovery automático `~/Projects/*` | Ruído (já rejeitado na ADR-0004) |
| Orquestração paralela obrigatória | Complexidade prematura |

## Referências

- [ADR-0004](./0004-multi-repo-workspace-registry.md)
- [ROADMAP Fase 3](../ROADMAP.md)
