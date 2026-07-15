# ADR-0008: Prompt Engine — brief governado (`@aios/prompt`)

- **Status:** Aceito
- **Data:** 2026-07-15
- **Decisores:** Kleilson dos Santos
- **Issue:** #59

## Contexto

O custo dominante no Cursor/Claude/Copilot hoje é **repetir** policies, preferências e contexto do repo a cada chat. A missão do AIOS é governança — não substituir o LLM da IDE. Precisamos de um artefato compacto que o Agent consuma em vez do “sermão”.

## Decisão

1. Engine **`@aios/prompt`** com `compilePrompt({ input, workspaceId?, repoPath? })`.
2. O brief inclui: pedido · intent · repo/workspace · resumo KG · must policies · constraints · memory · instruções curtas ao Agent.
3. **Não** chama LLM — só monta texto/estrutura determinística.
4. MCP `aios_compile_prompt` · CLI `--compile-prompt` (`--brief-only` imprime só o markdown).
5. `contractVersion` do pipeline permanece `"1"` (tool aditiva no MCP).

## Consequências

### Positivas

- Economia de tokens: input curto do usuário + brief gerado
- Alinha a policies > prompts longos (FOUNDATION)
- Prepara Router multi-provider (o brief é independente do modelo)

### Negativas / trade-offs

- Brief ainda heurístico (sem re-ranking LLM)
- Memória só entra se `workspaceId` presente

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Extensão IDE → Ollama primeiro | Substitui IDE; fora do escopo |
| Só Rules Cursor sem MCP | Já existe; insuficiente para memory/KG vivos |
| Gerar brief com LLM | Custo + não-determinismo na Fase 1 deste vertical |

## Referências

- [cursor-chat-bridge](../guides/cursor-chat-bridge.md)
- [ROADMAP Fase 3](../ROADMAP.md)
- [ADR-0006](./0006-memory-engine-session.md)
