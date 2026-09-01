# Glossário AIOS (orientação do owner · pt-BR)

> **Para quem:** você (owner), alinhamento mental do produto.  
> **Como usar (TDAH):** leia **uma etapa por vez**. Cada termo tem: analogia → o que é → para que serve → o que **não** é.  
> **Não é SSOT de produto.** Docs canônicos de produto ficam em **inglês** (`docs/**`, ADR-0018). Este arquivo é ajuda em português, fora do SSOT.  
> **Versão do monorepo na criação:** v0.48.1 · **Atualize** quando novos ADRs/engines mudarem o mapa.

---

## Mapa rápido (leia isto primeiro)

```text
                    VOCÊ (pedido curto)
                           │
                           ▼
              ┌─────────────────────────┐
              │   AIOS = "sistema de    │
              │   governo da IA"        │
              │   (não é só um chat)    │
              └─────────────────────────┘
                           │
     ┌──────────┬──────────┼──────────┬──────────┐
     ▼          ▼          ▼          ▼          ▼
  Policies   Context    Engines   Agents     Quality
  (regras)   (repo)    (módulos) (plugins)   Gate
```

**Frase âncora:** AIOS **governa** como a IA trabalha no SDLC. Agentes são **plugins**. Políticas vencem prompt longo.

---

# Etapa 1 — O produto em 5 ideias

### AIOS (AI Operating System)

|                    |                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------ |
| **Analogia**       | Não é o motorista (o LLM). É a **empresa de trânsito**: regras, rotas, inspeção, registro. |
| **O que é**        | Plataforma standalone de **governança de IA** no ciclo de software.                        |
| **Para que serve** | Gerir agentes, prompts, contexto, docs, conhecimento, MCPs e workflows com qualidade.      |
| **Não é**          | Montão de prompts; wrapper de um único ChatGPT; LangChain/CrewAI com outro nome.           |

### Governança (governance)

|                    |                                                                                   |
| ------------------ | --------------------------------------------------------------------------------- |
| **Analogia**       | Conselho + auditoria: quem pode o quê, o que foi decidido, o que passou no check. |
| **O que é**        | Conjunto de regras, audits, logs de decisão e superfícies (Console / status).     |
| **Para que serve** | IA previsível, auditável, alinhada a políticas — não “só gera texto”.             |
| **Não é**          | Só UI bonita; só checklist humano sem engine.                                     |

### SDLC

|                    |                                                                       |
| ------------------ | --------------------------------------------------------------------- |
| **Analogia**       | Linha de montagem do software: ideia → código → review → release.     |
| **O que é**        | _Software Development Life Cycle_ — ciclo de vida do desenvolvimento. |
| **Para que serve** | Contextualizar onde a IA atua (análise, review, docs, quality…).      |
| **Não é**          | Um produto específico; é o **terreno** onde AIOS opera.               |

### Standalone (ADR-0001)

|                    |                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------- |
| **Analogia**       | AIOS é o **prédio**; Cursor/Companion são **hóspedes** que usam a porta (MCP/CLI).  |
| **O que é**        | Decisão: AIOS é produto próprio, não um plugin interno de outra IDE.                |
| **Para que serve** | Evitar misturar “produto AIOS” com “ferramenta do dia”.                             |
| **Não é**          | “Não pode integrar” — integra sim, mas **não depende** de ser feature de outro app. |

### Agents as plugins

|                    |                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Analogia**       | Tomadas USB: Architecture, AppSec, Docs, QA encaixam; você fala com a **tomada (AIOS)**, não com o cabo. |
| **O que é**        | Agentes especializados são plugins; UX primária não chama agente direto.                                 |
| **Para que serve** | Orquestração central, políticas e quality gate únicos.                                                   |
| **Não é**          | “Vários chats soltos cada um com sua regra”.                                                             |

---

# Etapa 2 — Verdade do produto (SSOT e documentos)

### SSOT (Single Source of Truth)

|                    |                                                                           |
| ------------------ | ------------------------------------------------------------------------- |
| **Analogia**       | Relógio oficial da cidade. Outros relógios **copiam**; não inventam hora. |
| **O que é**        | A fonte **canônica** da verdade — se conflitar, **ela vence**.            |
| **Para que serve** | Evitar dois “lugares oficiais” (ex.: prompt RAG vs FOUNDATION).           |
| **Não é**          | “Único arquivo no mundo”; é “única **autoridade**” para aquele domínio.   |

**Hierarquia mental AIOS (ordem de autoridade):**

```text
1. Código (engines/, packages/, apps/)
2. FOUNDATION.md + ADRs + ROADMAP
3. policies/aios.policies.json
4. Guias / spikes / audits / PKB   ← ajuda, não substitui 1–3
```

### FOUNDATION

|                    |                                                                      |
| ------------------ | -------------------------------------------------------------------- |
| **Analogia**       | Constituição do país AIOS.                                           |
| **O que é**        | Documento canônico de origem/tese do produto (`docs/FOUNDATION.md`). |
| **Para que serve** | Resolver conflito de resumos; âncora do “o que é AIOS”.              |
| **Não é**          | ROADMAP (isso é o plano de fases); não é código.                     |

### ADR (Architecture Decision Record)

|                    |                                                                |
| ------------------ | -------------------------------------------------------------- |
| **Analogia**       | Ata de reunião: “decidimos X, rejeitamos Y, por Z”.            |
| **O que é**        | Registro numerado de decisão arquitetural (`docs/adr/00xx-…`). |
| **Para que serve** | Memória institucional; não reabrir decisão toda semana.        |
| **Não é**          | Tutorial; não é spike (spike **recomenda**, ADR **decide**).   |

### ROADMAP

|                    |                                                |
| ------------------ | ---------------------------------------------- |
| **Analogia**       | Mapa de fases da construção do prédio.         |
| **O que é**        | Plano de fases (0→5…) e o que já foi entregue. |
| **Para que serve** | Priorizar o que construir agora vs depois.     |
| **Não é**          | Lista de bugs do dia; não substitui Issue/PR.  |

### Spec / SPEC

|                    |                                                                              |
| ------------------ | ---------------------------------------------------------------------------- |
| **Analogia**       | Planta do móvel **antes** de furar a madeira.                                |
| **O que é**        | Especificação: contrato do que deve existir (API, comportamento, critérios). |
| **Para que serve** | Alinhar implementação e testes ao “deveria”.                                 |
| **No AIOS**        | Menos “SPEC.md” solto; mais **ADR + contrato de pipeline + schemas**.        |
| **Não é**          | Código; não é brainstorm.                                                    |

### Spike

|                    |                                                                           |
| ------------------ | ------------------------------------------------------------------------- |
| **Analogia**       | Prova de estrada: testa opções, recomenda, **não** entrega o carro final. |
| **O que é**        | Investigação curta (`docs/spikes/…`) com recomendação.                    |
| **Para que serve** | Decidir store/abordagem **antes** de feature/ADR.                         |
| **Não é**          | Feature pronta; não é ADR (até virar um).                                 |

### Audit (docs/audits)

|                    |                                               |
| ------------------ | --------------------------------------------- |
| **Analogia**       | Foto datada da obra — evidência do dia.       |
| **O que é**        | Snapshot / evidência pontual (nome com data). |
| **Para que serve** | Histórico de validação; não vira fonte viva.  |
| **Não é**          | FOUNDATION; não é guia eterno.                |

---

# Etapa 3 — Arquitetura: engines, packages, apps

### Engine

|                    |                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Analogia**       | Departamento da empresa (RH, Jurídico, TI).                                        |
| **O que é**        | Módulo em `engines/` com responsabilidade clara (`@aios/memory`, `@aios/policy`…). |
| **Para que serve** | Separar “quem faz o quê” sem um monólito de prompts.                               |
| **Não é**          | Agente de chat; não é plugin de agente (isso é `plugins/` / registry).             |

**Engines que você mais ouve falar:**

| Engine                | Em uma frase                                                        |
| --------------------- | ------------------------------------------------------------------- |
| **Intent**            | Entende o pedido (“analisar”, “implementar”, “auditar segurança”…). |
| **Policy**            | Regras must/should (docs oficiais, anti-overengineering…).          |
| **Context**           | Puxa pedaços relevantes do repo.                                    |
| **Prompt**            | Monta _brief_ governado (`compilePrompt`) — não substitui policy.   |
| **Knowledge**         | Grafo heurístico (relações Project→módulo→doc).                     |
| **Memory**            | Notas de sessão/projeto por workspace (JSON local).                 |
| **Documentation**     | Auditoria de docs + busca PKB (+ semântica opcional).               |
| **Governance**        | Status/audit/registro de decisões.                                  |
| **Quality Gate**      | “Pode sair?” antes da resposta final.                               |
| **Decision**          | “Esse agente precisa rodar?” — se não, não gasta.                   |
| **Provider**          | Fala com LLM (Ollama, OpenAI-compat, Anthropic…).                   |
| **Visibility**        | Correlaciona run ↔ KG ↔ estado ↔ métricas (export Obsidian).        |
| **Operational State** | Estado leve unificado (git, health…) sob demanda.                   |

### Package / monorepo

|                    |                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------- |
| **Analogia**       | Prédio com vários andares (`apps/`, `engines/`, `packages/`) no **mesmo** terreno Git. |
| **O que é**        | Vários pacotes npm/pnpm num único repositório.                                         |
| **Para que serve** | Compartilhar tipos (`@aios/shared`), pipeline, registry.                               |
| **Não é**          | Um único `package.json` gigante sem fronteiras.                                        |

### Apps (CLI · MCP · Console)

| App                   | Analogia                  | Serve para                                             |
| --------------------- | ------------------------- | ------------------------------------------------------ |
| **CLI** (`@aios/cli`) | Balcão do banco           | Você digita; AIOS executa (pipeline, search, export…). |
| **MCP** (`@aios/mcp`) | Tomada padrão USB-C da IA | Cursor/Companion chamam _tools_ `aios_*`.              |
| **Console**           | Painel de controle        | Health, Attention, Try-it, catálogo, métricas.         |

### Pipeline (`@aios/pipeline`)

|                    |                                                            |
| ------------------ | ---------------------------------------------------------- |
| **Analogia**       | Esteira: pedido entra → etapas → veredicto sai.            |
| **O que é**        | Contrato de integração (`runPipeline`) — coração do fluxo. |
| **Para que serve** | Um caminho estável CLI/MCP/Console (ADR-0003).             |
| **Não é**          | O LLM em si; não é um agente.                              |

### Harness (AI harness · ADR-0029)

|                    |                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Analogia**       | Arreio do cavalo: não é o animal (modelo); é o que **controla** direção, freio e segurança.     |
| **O que é**        | Estrutura em volta do modelo: policies, skills, contexto, KG, memory, MCP, hooks, quality gate. |
| **Para que serve** | Nomear o “controle” que AIOS já implementa como engines.                                        |
| **Não é**          | Outro produto; não é prompt único.                                                              |

Mapa: `docs/architecture/harness-mapping.md`.

---

# Etapa 4 — Três “cérebros de conhecimento” (não misturar!)

```text
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    PKB      │   │   MEMORY    │   │     KG      │
│  biblioteca │   │  caderno    │   │  mapa do    │
│  de prompts │   │  do projeto │   │  repositório│
└─────────────┘   └─────────────┘   └─────────────┘
     Docs-as-     preferências /         relações
     Code           decisões            heurísticas
```

Guia canônico (EN): `docs/guides/rag-boundaries.md`.

### PKB (Prompt Knowledge Base)

|                    |                                                                  |
| ------------------ | ---------------------------------------------------------------- |
| **Analogia**       | Estante de **receitas versionadas** (`docs/prompts/`).           |
| **O que é**        | Catálogo de assets de prompt (Markdown + `index.yaml`).          |
| **Para que serve** | Reutilizar padrões de engenharia sem virar segunda constituição. |
| **Não é**          | FOUNDATION; não é Memory; não é policy.                          |

Busca: textual/tags · opcional **semantic** (`mode=semantic`, índice local sqlite).

### Memory Engine

|                    |                                                            |
| ------------------ | ---------------------------------------------------------- |
| **Analogia**       | Caderno post-it do workspace: “prefiro PRs em sandbox”.    |
| **O que é**        | JSON em `.aios/memory/{workspaceId}.json`, cap FIFO (~50). |
| **Para que serve** | Preferências/decisões entre sessões **naquela máquina**.   |
| **Não é**          | RAG de prompts; não sincroniza multi-máquina; não é KG.    |

**FIFO:** fila “primeiro que entra, primeiro que sai” — entradas antigas **caem** quando passa do limite (spike #322: default = drop duro).

### Knowledge Graph (KG)

|                    |                                                              |
| ------------------ | ------------------------------------------------------------ |
| **Analogia**       | Planta baixa: “este package liga a este ADR”.                |
| **O que é**        | Grafo **heurístico** (regras/determinístico), não embedding. |
| **Para que serve** | Vizinhos estruturais no contexto (ADR-0005).                 |
| **Não é**          | Vector DB; não é histórico de chat.                          |

### RAG (Retrieval-Augmented Generation)

|              |                                                                                     |
| ------------ | ----------------------------------------------------------------------------------- |
| **Analogia** | Antes de responder, a IA **consulta a pasta certa** e cola trechos no contexto.     |
| **O que é**  | Geração aumentada por recuperação (busca + LLM).                                    |
| **No AIOS**  | Só se anexa ao **PKB** (índice opcional) — nunca para substituir Policy/FOUNDATION. |
| **Não é**    | “Jogar tudo no Pinecone e chamar de SSOT”.                                          |

### Embedding / vector / sqlite-vec

|              |                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------- |
| **Analogia** | Coordenadas no mapa: textos “parecidos” ficam perto.                                           |
| **O que é**  | Representação numérica para similaridade semântica.                                            |
| **No AIOS**  | Cache opcional `{AIOS_HOME}/.aios/pkb-vectors.sqlite` (ADR-0032); MVP com hash local + cosine. |
| **Não é**    | Obrigatório para o produto “ficar verde”; default = off + fallback textual.                    |

### Heurístico

|                    |                                                                         |
| ------------------ | ----------------------------------------------------------------------- |
| **Analogia**       | Régua e olho: regras práticas, sem “rede neural mágica”.                |
| **O que é**        | Abordagem baseada em regras/paths/padrões.                              |
| **Para que serve** | KG, audits de docs, agentes MVP — barato e previsível (Resource-Aware). |
| **Não é**          | Semântica por embedding (isso é outro modo).                            |

---

# Etapa 5 — MCP, ferramentas e privilégios

### MCP (Model Context Protocol)

|                    |                                                                             |
| ------------------ | --------------------------------------------------------------------------- |
| **Analogia**       | Tomada universal entre IDE/agente e o AIOS.                                 |
| **O que é**        | Protocolo para expor _tools_ (ex.: `aios_run_pipeline`, `aios_search_pkb`). |
| **Para que serve** | Cursor/Companion usam AIOS sem reinventar a API.                            |
| **Não é**          | O LLM; não é o Policy Engine.                                               |

### Tool / `aios_*`

|                    |                                                          |
| ------------------ | -------------------------------------------------------- |
| **Analogia**       | Botões do painel: cada um com nome e nível de permissão. |
| **O que é**        | Função registrada no servidor MCP.                       |
| **Para que serve** | Ações concretas (buscar PKB, lembrar, auditar…).         |
| **Não é**          | Agente completo.                                         |

### Privilege / capability (ADR-0024)

Níveis (do mais seguro ao mais sensível):

```text
READ_ONLY  →  SAFE_WRITE  →  CONTROLLED_EXECUTION  →  PRIVILEGED  →  HUMAN_APPROVAL
   ler           escrever          rodar pipeline           perigoso         humano
                 “seguro”
```

|                    |                                                          |
| ------------------ | -------------------------------------------------------- |
| **Analogia**       | Crachá do escritório: visitante vs funcionário vs admin. |
| **Para que serve** | Modelo **não escolhe** o privilégio; o runtime decide.   |

### SAFE_WRITE + consent (`AIOS_MCP_ALLOW_SAFE_WRITE=1`)

|                    |                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| **Analogia**       | “Sim, eu sei que vou apagar/exportar” — chave extra.                                             |
| **O que é**        | Policy must que exige env=1 para certas tools (clear memory, export Obsidian, rebuild vectors…). |
| **Para que serve** | Provar que policy pode **negar write**.                                                          |
| **Não é**          | Login OAuth; é consentimento operacional local.                                                  |

---

# Etapa 6 — Prompt, skills, hooks, policies

### Policy / Policy Engine

|                    |                                                                             |
| ------------------ | --------------------------------------------------------------------------- |
| **Analogia**       | Código de conduta fixo na parede — não precisa repetir no bilhete toda vez. |
| **O que é**        | Regras em `policies/aios.policies.json` (must/should).                      |
| **Para que serve** | Pedidos curtos; qualidade consistente.                                      |
| **Não é**          | Prompt de 3 páginas colado no chat.                                         |

### Brief (Prompt Engine)

|                    |                                                         |
| ------------------ | ------------------------------------------------------- |
| **Analogia**       | Briefing de reunião: contexto + regras já aplicadas.    |
| **O que é**        | Texto governado montado por `compilePrompt` (ADR-0008). |
| **Para que serve** | Economia de tokens + policies injetadas.                |
| **Não é**          | PKB asset; não é Memory.                                |

### Skill pack (ADR-0026)

|                    |                                                                |
| ------------------ | -------------------------------------------------------------- |
| **Analogia**       | Kit “como fazer X” (ferramentas permitidas + falha).           |
| **O que é**        | Pack opcional no Prompt Engine (`id`, purpose, allowedTools…). |
| **Para que serve** | **How**, não **who** (who = agente). Default = nenhum.         |
| **Não é**          | Novo agente; não é marketplace de hooks.                       |

### Hook (ADR-0027)

|                    |                                                                   |
| ------------------ | ----------------------------------------------------------------- |
| **Analogia**       | Sensor na esteira: _before/after_ policy                          | context | agent | gate. |
| **O que é**        | Interceptação na lista central do pipeline.                       |
| **Para que serve** | Extensão controlada do fluxo.                                     |
| **Não é**          | `if` espalhado; não intercepta MCP tools como “hook marketplace”. |

### Intent

|                    |                                                                          |
| ------------------ | ------------------------------------------------------------------------ |
| **Analogia**       | Classificar o pedido: “é review? é fix? é audit security?”.              |
| **O que é**        | Engine que tipifica a intenção (`implement.feature`, `audit.security`…). |
| **Para que serve** | Escolher workflow/agentes certos.                                        |
| **Não é**          | A resposta final.                                                        |

### ACT / honest ACT UX

|                    |                                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| **Analogia**       | Placa “esta loja **não** entrega em casa” — honestidade.                        |
| **O que é**        | Pipeline declara `capabilities.act=false` quando não escreve código de verdade. |
| **Para que serve** | Não fingir que `implement.feature` aplicou patch se só analisou.                |
| **Não é**          | Feature de deploy automático.                                                   |

---

# Etapa 7 — Modelos, providers, roteamento

### Provider

|                    |                                                                 |
| ------------------ | --------------------------------------------------------------- |
| **Analogia**       | Concessionária: Ollama local, API OpenAI-compat, Anthropic…     |
| **O que é**        | Adaptador `@aios/provider` para falar com um backend de modelo. |
| **Para que serve** | Trocar fornecedor sem reescrever o pipeline.                    |

### Capability class (ADR-0025)

|                    |                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Analogia**       | Você pede “carpintaria”, não “marca X da serra”.                                         |
| **O que é**        | Classe: `fast` \| `coding` \| `reasoning` \| `arbitration` — **nunca** vendor no router. |
| **Para que serve** | Operator faz bind via `AIOS_ROUTE_*` (default local Ollama).                             |
| **Não é**          | Hardcode “sempre GPT-4” no produto.                                                      |

### TaskProfile (ADR-0031)

|                    |                                                     |
| ------------------ | --------------------------------------------------- |
| **Analogia**       | Perfil da viagem: urgência, privacidade, custo.     |
| **O que é**        | Roteamento consciente de complexidade/privacy/cost. |
| **Para que serve** | Preferir local quando privacy exige.                |

### Resource-Aware (ADR-0011)

|                    |                                                                             |
| ------------------ | --------------------------------------------------------------------------- |
| **Analogia**       | MacBook 16GB: não ligue Postgres+Docker+3 Ollamas “porque o diagrama tem”.  |
| **O que é**        | Política: minimizar CPU/RAM/disco/processos; inspecionar antes de instalar. |
| **Para que serve** | Decisões de infra enxutas.                                                  |
| **Não é**          | “Nunca use cloud”; é “justifique e reutilize”.                              |

---

# Etapa 8 — Git, entrega, SemVer (o ritmo do projeto)

### sandbox → main

|                    |                                                                   |
| ------------------ | ----------------------------------------------------------------- |
| **Analogia**       | Laboratório (`sandbox`) depois vitrine (`main`).                  |
| **O que é**        | Fluxo: Issue → branch → PR → **sandbox** → PR promote → **main**. |
| **Para que serve** | Integração estável; main só com promoção.                         |

### SemVer (`vMAJOR.MINOR.PATCH`)

|                    |                                                                      |
| ------------------ | -------------------------------------------------------------------- |
| **Analogia**       | Número da edição do livro: mudança grande / feature / correção.      |
| **O que é**        | Versionamento + tag anotada + CHANGELOG.                             |
| **Cadência owner** | `next` = proposta · `ok` = implementa · `green` = promove + release. |

### CHANGELOG / Unreleased

|              |                                                              |
| ------------ | ------------------------------------------------------------ |
| **Analogia** | Diário do que mudou; `[Unreleased]` = ainda não saiu em tag. |

### CI / quality gates (repo)

|                                                                                     |                                                             |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Analogia**                                                                        | Raio-X antes do merge (lint, typecheck, testes, security…). |
| **Não confundir** com **Quality Gate** do _pipeline de IA_ (veredicto da resposta). |

---

# Etapa 9 — Workspace, Companion, Visibility

### Workspace (ADR-0004)

|                    |                                                       |
| ------------------ | ----------------------------------------------------- |
| **Analogia**       | Pasta de cliente no escritório: id → caminho do repo. |
| **O que é**        | Registro multi-repo (`workspaceId` → `repoPath`).     |
| **Para que serve** | Memory/pipeline/MCP no repo certo.                    |

### Companion (ADR-0014)

|              |                                                                        |
| ------------ | ---------------------------------------------------------------------- |
| **Analogia** | App de experiência (voz/conversa depois); AIOS continua o **cérebro**. |
| **O que é**  | Repo separado `aios-companion` — cliente do control plane.             |
| **Não é**    | Segundo AIOS; não duplica engines.                                     |

### Visibility Plane (ADR-0030)

|              |                                                             |
| ------------ | ----------------------------------------------------------- |
| **Analogia** | Mesa de luz: sobrepõe run + KG + estado + métricas.         |
| **O que é**  | Snapshot correlacionado; export Obsidian **unidirecional**. |
| **Não é**    | Quarto SSOT; Obsidian não vira fonte da verdade.            |

### Observability / Prometheus / JSONL

|                    |                                                                                  |
| ------------------ | -------------------------------------------------------------------------------- |
| **Analogia**       | Tacômetro + caixa-preta de eventos.                                              |
| **O que é**        | Métricas (`GET /metrics`, `--metrics-prometheus`) + eventos em `.aios/metrics/`. |
| **Para que serve** | Consumo de provider, health de agentes, CI delivery (ADR-0028).                  |

---

# Etapa 10 — Índice A–Z (consulta rápida)

| Termo                | Em uma linha                                                                        |
| -------------------- | ----------------------------------------------------------------------------------- |
| **ACT**              | Capacidade de _escrever/aplicar_ mudança — hoje honesta = false no pipeline default |
| **ADR**              | Decisão arquitetural registrada                                                     |
| **Agent**            | Plugin especializado (Architecture, AppSec, Docs, QA…)                              |
| **Brief**            | Texto governado do Prompt Engine                                                    |
| **Capability class** | Classe de modelo (fast/coding/…) não vendor                                         |
| **CI**               | Checagens automatizadas no GitHub                                                   |
| **Console**          | UI de governança                                                                    |
| **Context Engine**   | Recorte do repo para a esteira                                                      |
| **FIFO**             | Descarta o mais antigo quando a fila enche                                          |
| **FOUNDATION**       | Constituição do produto                                                             |
| **Harness**          | Estrutura de controle em volta do modelo                                            |
| **Hook**             | Intercept before/after no pipeline                                                  |
| **Intent**           | Classificação do pedido                                                             |
| **KG**               | Grafo heurístico do projeto                                                         |
| **MCP**              | Protocolo de tools para IDE/agentes                                                 |
| **Memory**           | Caderno local por workspace                                                         |
| **Monorepo**         | Vários pacotes num Git                                                              |
| **PKB**              | Biblioteca versionada de prompts                                                    |
| **Pipeline**         | Esteira `runPipeline`                                                               |
| **Policy**           | Regra must/should persistente                                                       |
| **Privilege**        | Nível de permissão da tool MCP                                                      |
| **Provider**         | Backend LLM                                                                         |
| **Quality Gate**     | Veredicto antes da resposta sair                                                    |
| **RAG**              | Buscar + gerar (no AIOS: PKB)                                                       |
| **Resource-Aware**   | Poupar hardware; inspecionar antes de instalar                                      |
| **SAFE_WRITE**       | Escrita “segura” + às vezes consent env                                             |
| **sandbox**          | Branch de integração pré-main                                                       |
| **Semantic search**  | Busca por significado (vetor), não só palavra                                       |
| **SemVer**           | Versão MAJOR.MINOR.PATCH                                                            |
| **Skill**            | Pack “como” (não “quem”)                                                            |
| **Spike**            | Investigação com recomendação                                                       |
| **SSOT**             | Fonte canônica da verdade                                                           |
| **Standalone**       | AIOS é produto próprio                                                              |
| **TaskProfile**      | Perfil de roteamento (custo/privacy/…)                                              |
| **Visibility**       | Correlação run/KG/estado; export opcional                                           |
| **Workspace**        | Id → repo path                                                                      |

---

# Etapa 11 — Como estudar sem overload (TDAH)

1. **Dia 1:** Etapas 1–2 (produto + SSOT). Pare.
2. **Dia 2:** Etapa 3 (engines) + diagrama do harness.
3. **Dia 3:** Etapa 4 (PKB / Memory / KG) — a que mais evita confusão.
4. **Dia 4:** Etapas 5–6 (MCP + policies/skills/hooks).
5. **Dia 5:** Etapas 7–9 (modelo + git + companion).
6. **Sempre:** use a **Etapa 10** como cola rápida.

**Três frases para decorar:**

1. **Políticas > prompts longos.**
2. **Agentes = plugins; você fala com o AIOS.**
3. **PKB ≠ Memory ≠ KG ≠ FOUNDATION** — quatro caixas, quatro empregos.

---

## Onde aprofundar (inglês canônico)

| Tema           | Link                                   |
| -------------- | -------------------------------------- |
| Constituição   | `docs/FOUNDATION.md`                   |
| Visão          | `docs/VISION.md`                       |
| Fases          | `docs/ROADMAP.md`                      |
| Harness        | `docs/architecture/harness-mapping.md` |
| Fronteiras RAG | `docs/guides/rag-boundaries.md`        |
| ADRs           | `docs/adr/`                            |
| PKB            | `docs/prompts/README.md`               |

---

## Manutenção

Quando surgir termo novo (novo ADR/engine): acrescente **uma** linha na Etapa 10 e um bloco curto na etapa temática — sem reescrever o arquivo inteiro.
