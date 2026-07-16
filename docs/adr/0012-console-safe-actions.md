# ADR-0012: Console safe actions — Try it (provar runtime)

- **Status:** Aceito
- **Data:** 2026-07-15
- **Decisores:** Kleilson dos Santos
- **Issue:** #76

## Contexto

O MVP Health+Attention (ADR-0010) mostra estado, mas não prova valor: falta o loop **ver → agir → ver resultado**. O utilizador pediu um console mais interativo e palatável, sem virar IDE nem chamar agentes no UX.

## Decisão

1. Coluna **Try it** no `@aios/console` com ações **seguras** que chamam engines já existentes.
2. API local `POST /api/action` `{ action, input?, workspaceId? }` → `{ ok, latencyMs, result }`.
3. Ações MVP:
   - `contract` — `PIPELINE_CONTRACT_VERSION`
   - `validate_workspaces` — `listValidatedWorkspaces`
   - `load_policies` — `loadPolicies` + mustIds
   - `compile_brief` — `compilePrompt` (brief truncado se muito longo)
   - `provider_ping` — `getProvider().health()` (Ollama opcional)
   - `memory_recall` / `memory_remember` — `@aios/memory`
4. **Fora:** executar agentes plugins, chat Copilot-like, Grafana, novos serviços (Resource-Aware / ADR-0011).
5. Agentes continuam plugins — não aparecem como botões de “run agent”.

## Consequências

### Positivas

- Prova funcional sem Ollama obrigatório (várias ações não dependem dele)
- Reutiliza engines/MCP contract; zero stack nova
- Alinha a policies > sermões (brief gerado no sítio)

### Negativas / trade-offs

- API só localhost (não auth SaaS)
- Output JSON/markdown simples (não editor rico)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Só refresh de status | Não prova engines |
| Botões de agentes | Viola AGENTS.md / FOUNDATION |
| Proxy para Cursor Agent | Fora de escopo do console |

## Referências

- [ADR-0010](./0010-governance-console.md)
- [ADR-0011](./0011-resource-aware-macos.md)
- [FOUNDATION](../FOUNDATION.md)
