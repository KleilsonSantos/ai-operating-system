# ADR-0005: Knowledge Graph heurístico (`@aios/knowledge`)

- **Status:** Aceito
- **Data:** 2026-07-14
- **Decisores:** Kleilson dos Santos
- **Issue:** #47

## Contexto

A Fase 2 pede Knowledge Graph básico (relações Projeto → …). Embeddings / LLM deixariam o núcleo lento, opaco e dependente de provider — incompatível com a política “engines primeiro, prompts curtos”.

## Decisão

1. Engine **`@aios/knowledge`** com `buildKnowledgeGraph({ repoPath })` determinístico.
2. Nós: `project` · `module` · `package` · `engine` · `doc` · `policy` · `workspace` · `infra` · `api` · `database`.
3. Arestas: `contains` · `depends_on` (workspace:*) · `documents`.
4. Fontes: layout monorepo (`packages`/`engines`/`apps`), docs canônicos, policies, docker/Compose, deps de API/DB no `package.json`.
5. `PipelineResponse.knowledge` = **resumo** (`nodeCount` / `edgeCount` / `kinds` / `signals`). Grafo completo via MCP `aios_build_knowledge` (`full: true`).
6. `contractVersion` permanece `"1"` (campo aditivo).

## Consequências

### Positivas

- Auditável, offline, barato
- Alimenta Context/Memory futuros por `workspaceId` + nós

### Negativas / trade-offs

- Heurística superficial (sem tipos profundos de código)
- `depends_on` só via `workspace:*` + hints de deps

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Embeddings já na MVP | Escopo Fase 3 / custo |
| Neo4j / store externo | Infra precoce |
| Só docs markdown sem graph | Pouca utilidade para orquestração |

## Referências

- [ROADMAP Fase 2](../ROADMAP.md)
- [`engines/knowledge`](../../engines/knowledge/)
- [ADR-0004](./0004-multi-repo-workspace-registry.md)
