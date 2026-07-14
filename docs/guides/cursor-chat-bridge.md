# Ponte Cursor Chat ↔ AIOS (Nível 1)

O Agent do Cursor **não** descobre o AIOS sozinho. Este repo injeta as policies em todo chat via **Project Rules**.

## Como funciona

```text
Você digita no chat (pedido curto)
        ↓
Cursor Agent carrega .cursor/rules/*.mdc (alwaysApply)
        ↓
Conteúdo gerado a partir de policies/aios.policies.json
        ↓
Resposta já alinhada (best practices, Git, sem depreciação…)
```

Não precisa lembrar do CLI para “seguir o regulamento”.

## Regenerar após editar policies

```bash
pnpm sync:cursor-rules
```

Isso atualiza:

- `.cursor/rules/aios-policies.mdc` — policies do Policy Engine
- `.cursor/rules/aios-sdlc.mdc` — fluxo Git / commits / ROADMAP
- `.cursor/rules/.sync-meta.json` — metadados da geração

## Próximo nível (ainda não neste PR)

MCP server com `load_policies` / `gather_context` — ligação viva com o runtime. Ver ROADMAP Fase 3 (integrations) e adiantamento possível após o núcleo.

## Smoke CLI (opcional)

```bash
pnpm --filter @aios/cli dev -- "Analise meu projeto."
```
