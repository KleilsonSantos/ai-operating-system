# ADR-0011: Resource-Aware Development (macOS) como política canónica

- **Status:** Aceito
- **Data:** 2026-07-15
- **Decisores:** Kleilson dos Santos

## Contexto

O MacBook de desenvolvimento (16GB, IDEs, browser, console AIOS) não aguenta bem “instalar por default” (Ollama + modelos, Docker Desktop, K8s local). Sem política explícita, agentes sugerem stack pesada e duplicada.

## Decisão

1. Documento canónico: [`docs/policies/resource-aware-macos.md`](../policies/resource-aware-macos.md).
2. Policies operacionais em `policies/aios.policies.json` (`resource-first`, `inspect-before-install`, `reuse-before-create`, `ai-provider-reuse`) — sincronizadas para Cursor via `pnpm sync:cursor-rules`.
3. Provider Ollama auxiliar permanece **opcional**; console trata inatividade como **warn**, não como falha do produto.
4. Antes de instalar Ollama/Gemini/DeepSeek local: inspecionar ambiente; preferir reutilizar API/MCP já disponíveis se cobrirem o caso.

## Consequências

### Positivas

- Menos pressão para instalar software pesado só para “ficar verde”
- Alinha agents a inspecionar antes de agir
- Compatível com economia de tokens (FOUNDATION)

### Negativas / trade-offs

- Auxiliar local (Ollama) exige decisão consciente + RAM
- Free tiers cloud (Gemini) podem ser preferíveis ao modelo local em Mac 16GB

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Só prompt longo no chat | Viola `short-user-prompt` / policies > sermões |
| Ollama obrigatório no health | Força instalação e RAM sem necessidade de governança |

## Referências

- [FOUNDATION](../FOUNDATION.md)
- [ADR-0009](./0009-multi-provider-ollama.md)
- [ADR-0010](./0010-governance-console.md)
