# Control plane (AIOS) · Companion (experiência)

> Canónico: [ADR-0014](../adr/0014-control-plane-companion.md).

## Em uma frase

O **AIOS governa**; o **Companion conversa e opera a experiência** — sem copiar engines.

## Quem faz o quê

| Capacidade | AIOS | Companion |
| --- | --- | --- |
| Policies / quality / brief | ✅ | consome |
| Memory / KG / docs audit | ✅ | consome |
| Console de governança | ✅ | opcional deep-link |
| Voz / diálogo contínuo | ❌ | ✅ |
| Watchers IDE/Docker/Git | ❌ (MVP) | ✅ (quando existir) |
| Abrir IDE / subir containers | ❌ (fora de escopo) | ✅ com Resource-Aware |

## Contratos

1. MCP `@aios/mcp` — tools `aios_*`
2. `@aios/pipeline` — `runPipeline` / `contractVersion`
3. CLI `aios` — smoke e automação

Companion **não** importa internals de `engines/*` como API pública estável; usa os contratos acima.

## Ordem de entrega sugerida

1. **No AIOS:** Operational State / eventos leves — `@aios/operational-state` (`getOperationalState`, `aios_operational_state`) — [ADR-0015](../adr/0015-operational-state.md).
2. **Repo companion:** Conversation Manager + consumo MCP (chat primeiro; voz depois).
3. Capabilities/watchers sob Resource-Aware — inspecionar antes de instalar; um runtime só.

## Contrato Companion (mínimo)

| Tool / API | Uso |
| --- | --- |
| `aios_operational_state` | Snapshot: focus, git, health, memory/governance |
| `aios_governance_status` | Health + attention detalhado |
| `aios_memory_*` / `aios_governance_*` | Memória e decisões |
| `runPipeline` / `contractVersion` | Workflow governado |

Não importar `engines/*` como API pública.

## Anti-padrões

- Segundo Policy Engine no companion
- Polling agressivo de CPU/RAM “para parecer vivo”
- Gateway MCP que funde centenas de tools sem scoping
