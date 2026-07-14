# ADR-0003: Contrato de integração via `@aios/pipeline`

- **Status:** Aceito
- **Data:** 2026-07-14
- **Decisores:** Kleilson dos Santos
- **Issue:** #9

## Contexto

Integradores (CLI, futuros HTTP/MCP, outros produtos) precisam consumir o núcleo AIOS sem copiar engines para dentro de outros monorepos e sem acoplar ao layout interno do workspace.

## Decisão

1. **Contrato tipado** `PipelineRequest` / `PipelineResponse` em `@aios/shared`, versão `contractVersion: "1"`.
2. **Runtime de integração** `runPipeline()` em `@aios/pipeline` — único entrypoint suportado para o fluxo Fase 1.
3. **`@aios/cli`** é um cliente fino: parse de argv → `runPipeline` → JSON stdout; exit `1` se `!verdict.passed`.
4. HTTP/MCP podem encapsular o mesmo `runPipeline` depois; não muda o contrato v1.

```text
Integrador  →  @aios/pipeline.runPipeline  →  engines (intent…quality-gate)
```

## Consequências

### Positivas

- Fronteira clara para produto standalone (ADR-0001)
- Smoke e docs alinhados a um shape JSON estável
- Evita “vender” engines internos como API pública

### Negativas / trade-offs

- Mais um pacote workspace (`@aios/pipeline`)
- Evolução do contrato exige bump de `contractVersion` (sem quebrar silenciosamente)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Integrador importa engines direto | API instável; acoplamento ao monorepo |
| Só documentação sem `runPipeline` | Sem smoke programático / regressão |
| Colocar `runPipeline` em `@aios/core` | Ciclo de dependência com engines que já dependem de core |

## Referências

- [`docs/FOUNDATION.md`](../FOUNDATION.md)
- [`packages/pipeline/README.md`](../../packages/pipeline/README.md)
- [`docs/guides/cursor-chat-bridge.md`](../guides/cursor-chat-bridge.md) — Nível 1 chat (Rules), complementar ao pipeline
