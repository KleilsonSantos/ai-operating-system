# ADR-0016: OpenAI-compatible cloud provider

- **Status:** Aceito
- **Data:** 2026-07-17
- **Decisores:** Kleilson dos Santos
- **Issue:** #105

## Contexto

ADR-0009 deixou cloud providers como stub futuro. O Companion já expõe `aios_provider_*`; falta um backend remoto atrás do mesmo contrato, sem instalar Ollama só para “ficar vivo” (Resource-Aware).

## Decisão

1. **`OpenAICompatibleProvider`** (`id: openai`) via `fetch` — Chat Completions + Models ([API oficial](https://developers.openai.com/api/docs/api-reference/chat)).
2. Env: `AIOS_OPENAI_API_KEY` (ou `OPENAI_API_KEY`) · `AIOS_OPENAI_BASE_URL` (default `https://api.openai.com/v1`) · `AIOS_OPENAI_MODEL` (default `gpt-4o-mini`).
3. Sem API key → `health.ok=false` (não throw na health; chat falha explícito).
4. `baseUrl` custom cobre gateways OpenAI-compatible (Groq, proxies, etc.) — **não** Anthropic nativo neste vertical.
5. Sem SDK OpenAI no monorepo (mínimo; trade-off: sem streaming/tool-calling ainda).

## Consequências

### Positivas

- Mesmo MCP/CLI/Companion (`--provider openai`)
- Zero instalação local obrigatória
- Gateways compatíveis reutilizam o mesmo código

### Negativas / trade-offs

- Anthropic Messages API fica para outro vertical (ou gateway compat)
- Custo/rede sob demanda — operador gere a key

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| SDK `openai` npm | Overkill para health/models/chat mínimo; mais superfície |
| Anthropic nativo já | Segundo protocolo; adiar |
| Tornar openai default | Ollama continua default local; cloud opt-in |

## Referências

- [ADR-0009](./0009-multi-provider-ollama.md)
- [OpenAI Chat Completions](https://developers.openai.com/api/docs/api-reference/chat)
- [ROADMAP Fase 3](../ROADMAP.md)
