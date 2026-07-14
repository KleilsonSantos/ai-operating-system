# ADR-0004: Registry multi-repositório (`@aios/workspace`)

- **Status:** Aceito
- **Data:** 2026-07-14
- **Decisores:** Kleilson dos Santos
- **Issue:** #43

## Contexto

A Fase 2 pede onboarding de múltiplos repositórios. O núcleo já aceita `repoPath`, mas integradores (MCP, CLI) precisam de **ids estáveis** e um arquivo de registro versionável — sem hardcodar paths absolutos em cada chamada.

## Decisão

1. **Arquivo canônico** `workspaces/aios.workspaces.json` (ou `aios.workspaces.json` na raiz / walk-up), shape:

```json
{
  "workspaces": [
    { "id": "aios", "name": "AI Operating System", "path": ".", "default": true }
  ]
}
```

2. **Engine** `@aios/workspace`: `loadWorkspaces` / `resolveWorkspace(id?)`.
3. **`PipelineRequest.workspaceId`** (opcional). Prioridade: `repoPath` explícito > workspace resolve > `cwd`.
4. **MCP** `aios_list_workspaces` + `workspaceId` em `aios_run_pipeline` / `aios_load_policies`.
5. `contractVersion` permanece `"1"` (campo opcional aditivo; não quebra clientes).

Paths relativos no registry sob `workspaces/` resolvem contra a **raiz do monorepo AIOS** (parent de `workspaces/`).

## Consequências

### Positivas

- Onboarding: acrescentar um id + path no JSON
- MCP/CLI usam o mesmo resolve
- Prepara Knowledge Graph / Memory por `workspaceId`

### Negativas / trade-offs

- Mais um engine no monorepo
- Paths absolutos de máquina ainda podem aparecer no registry (documentados como ok para clone local)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Só env `AIOS_REPO` | Sem catálogo / multi-alvo |
| Discover automático por `~/Projects/*` | Ruído; sem intents explícitos |
| Bump `contractVersion` para 2 | Desnecessário para campo opcional |

## Referências

- [ROADMAP Fase 2](../ROADMAP.md)
- [`engines/workspace`](../../engines/workspace/)
- [ADR-0003](./0003-pipeline-integration-contract.md)
