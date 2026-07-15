# ADR-0009: Multi-provider MVP — AIProvider + Ollama

- **Status:** Aceito
- **Data:** 2026-07-15
- **Decisores:** Kleilson dos Santos
- **Issue:** #67

## Contexto

Fase 3 pede multi-provider. O objetivo imediato é **economizar tokens/API** com tarefas baratas/locais — não substituir o LLM da IDE nem construir extensão VS Code. Ollama local é o primeiro backend concreto atrás de uma abstração estável.

## Decisão

1. Engine **`@aios/provider`** com interface `AIProvider` (`health` · `models` · `chat`).
2. Implementação **`OllamaProvider`** via HTTP (`AIOS_OLLAMA_URL`, default `http://127.0.0.1:11434`; modelo `AIOS_OLLAMA_MODEL`).
3. Router stub `getProvider(id)` — só seleção por nome neste MVP.
4. MCP: `aios_provider_health` · `aios_provider_models` · `aios_provider_chat`.
5. CLI: `--provider-health` · `--provider-chat` · `--provider=` · `--model=`.
6. Coding / review pesado continua no Cursor Agent; Ollama = auxiliar.

## Consequências

### Positivas

- Ponto único para plugar Claude/OpenAI/Gemini depois
- Health barato sem acoplar ao pipeline `contractVersion`
- Alinha a “não substituir IDE” (FOUNDATION / ADR-0001)

### Negativas / trade-offs

- Só Ollama no MVP; outros providers são stubs futuros
- Sem streaming / embeddings / tool-calling neste vertical
- Depende de Ollama instalado e a correr no host

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Extensão IDE → Ollama | Fora de escopo; compete com a IDE |
| Colar Ollama no Prompt Engine | Prompt Engine só monta brief determinístico (ADR-0008) |
| SDKs OpenAI/Anthropic já | Escopo; depois de Ollama validado |

## Referências

- [ROADMAP Fase 3](../ROADMAP.md)
- [ADR-0008](./0008-prompt-engine-brief.md)
- [Ollama API](https://docs.ollama.com/api)
