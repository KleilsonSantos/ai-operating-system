# ADR-0006: Memory Engine de sessão/projeto (`@aios/memory`)

- **Status:** Aceito
- **Data:** 2026-07-14
- **Decisores:** Kleilson dos Santos
- **Issue:** #51

## Contexto

Fase 2 pede Memory Engine (sessão / projeto). Persistência precisa ser simples, local e alinhada a `workspaceId` (ADR-0004) — sem vector DB nesta fase.

## Decisão

1. Engine **`@aios/memory`**: `remember` · `recall` · `clearMemory` · `listMemoryWorkspaces`.
2. Store em disco: `{AIOS_HOME}/.aios/memory/{workspaceId}.json` (cap FIFO, default 50 entradas).
3. `.aios/` no `.gitignore` (estado local da máquina).
4. `PipelineResponse.memory` = recall curto quando há `workspaceId` (desligável com `includeMemory: false`).
5. MCP: `aios_memory_remember` · `aios_memory_recall` · `aios_memory_clear`.
6. `contractVersion` permanece `"1"`.

## Consequências

### Positivas

- Preferências / decisões do projeto ficam explícitas entre chats
- Mesma chave `workspaceId` do registry

### Negativas / trade-offs

- Sem sync multi-máquina
- Sem embeddings (busca = substring / tag)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Só memória em RAM | Perde entre restarts do MCP |
| SQLite/Postgres já | Escopo Fase 3 |
| Vector store | Overengineering nesta fase |

## Referências

- [ROADMAP Fase 2](../ROADMAP.md)
- [`engines/memory`](../../engines/memory/)
- [ADR-0004](./0004-multi-repo-workspace-registry.md) · [ADR-0005](./0005-knowledge-graph-heuristic.md)
