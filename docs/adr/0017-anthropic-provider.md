# ADR-0017: Anthropic Messages provider

- **Status:** Aceito
- **Data:** 2026-07-17
- **Decisores:** Kleilson dos Santos
- **Issue:** #109

## Contexto

ADR-0016 cobriu OpenAI-compatible. Anthropic usa protocolo distinto (`x-api-key`, `anthropic-version`, Messages API com `max_tokens` e `system` separado) — não cabe no adapter OpenAI.

## Decisão

1. **`AnthropicProvider`** (`id: anthropic`) via `fetch` — `POST /v1/messages` · `GET /v1/models`.
2. Headers obrigatórios: `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`.
3. Env: `AIOS_ANTHROPIC_API_KEY` (ou `ANTHROPIC_API_KEY`) · `AIOS_ANTHROPIC_BASE_URL` (default `https://api.anthropic.com`) · `AIOS_ANTHROPIC_MODEL` (default `claude-haiku-4-5` — auxiliar barato).
4. System prompts do contrato AIOS → campo `system`; só `user`/`assistant` em `messages`.
5. Sem SDK Anthropic no monorepo (mínimo; sem streaming/tools neste vertical).

## Consequências

### Positivas

- Claude nativo no mesmo MCP/CLI/Companion
- Default Haiku alinha Resource-Aware (custo)

### Negativas / trade-offs

- Dois protocolos cloud (OpenAI vs Anthropic) — aceitável vs forçar gateway único
- `max_tokens` fixo 1024 no MVP (override depois se precisar)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Só via OpenAI-compat gateway | Perde features nativas; operador nem sempre tem gateway |
| SDK `@anthropic-ai/sdk` | Overkill para health/models/chat |

## Referências

- [ADR-0016](./0016-openai-compatible-provider.md)
- [Anthropic API overview](https://platform.claude.com/docs/en/api/overview)
- [ROADMAP Fase 3](../ROADMAP.md)
