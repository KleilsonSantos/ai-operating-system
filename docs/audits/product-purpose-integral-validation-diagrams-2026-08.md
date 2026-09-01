# Product & Purpose Integral Validation — Diagrams

| Field             | Value                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Date**          | 2026-08-31                                                                                                                                                                                                            |
| **Companion doc** | [`product-purpose-integral-validation-audit-2026-08.md`](./product-purpose-integral-validation-audit-2026-08.md)                                                                                                      |
| **Language note** | Diagram labels are **pt-BR** by explicit owner request (chat, 2026-08-31). This is a deliberate exception scoped to these two diagrams only — ADR-0018 / `docs-language-en` still governs regular product-docs prose. |

Two diagrams generated during the product/purpose audit session:

1. **Fluxograma** — real execution flow of `runPipeline` (`packages/pipeline/src/index.ts`), the quality gate (`engines/quality-gate/src/index.ts`), multi-workspace fan-out (`runAcrossWorkspaces`), and the MCP capability gate (`authorizeMcpTool`, `packages/shared/src/index.ts`).
2. **Diagrama de classes** — conceptual/data model implied by the audit prompt itself ([`product-purpose-integral-validation.v1.md`](../prompts/by-domain/ai-engineering/product-purpose-integral-validation.v1.md)), not object-oriented source code.

Both diagrams were validated with the Mermaid syntax validator before being saved here.

---

## 1. Fluxograma — `runPipeline` / quality gate / multi-workspace / MCP

```mermaid
flowchart TD
    Start(["runPipeline(request)"]) --> A["Aparar input / usar texto padrão"]
    A --> B{"repoPath informado?"}
    B -->|Sim| C["resolve(repoPath)"]
    B -->|Não| D["resolveWorkspace(workspaceId)"]
    D --> E{"Workspace encontrado?"}
    E -->|Sim| F["Definir repoPath + workspaceMeta + memoryWorkspaceId"]
    E -->|Não| G["repoPath = cwd()"]
    C --> H["resolveIntent(input)"]
    F --> H
    G --> H

    H --> I["loadPolicies + applyPolicies"]
    I --> J["resolveCallerPrivilege"]
    J --> K["resolveContextBudget"]
    K --> L["routeModel"]
    L --> M["gatherContext"]
    M --> N["buildKnowledgeGraph + summarizeKnowledge"]

    N --> O{"wantMemory && memoryWorkspaceId?"}
    O -->|Sim| P["recall() entradas de memória"]
    O -->|Não| Q["Pular memória"]
    P --> R["runWorkflow(intent, policies, context)"]
    Q --> R

    R --> S{"impliesActIntent(intent.kind) && !capabilities.act?"}
    S -->|Sim| T["Injetar finding 'act.unavailable'"]
    S -->|Não| U["Usar workflow.results como está"]
    T --> V["evaluateQuality(results, intent, context)"]
    U --> V

    V --> W["buildPipelineRun(...)"]
    W --> X["Montar objeto PipelineResponse"]
    X --> End(["Retornar PipelineResponse"])

    %% detalhe do evaluateQuality
    subgraph EQ["evaluateQuality()"]
        direction TB
        EQ1{"options informado?"} -->|Não| EQ2["checks.hasFindings apenas"]
        EQ1 -->|Sim| EQ3["checks.knownIntent = intent.kind !== 'unknown'"]
        EQ3 --> EQ4["checks.agentsScheduled = agentes esperados rodaram"]
        EQ4 --> EQ5["checks.nonEmptyRun"]
        EQ5 --> EQ6["checks.contextPresent (analyze.project exige snippets)"]
        EQ6 --> EQ7["checks.policiesInjected"]
        EQ7 --> EQ8["checks.hasDomainFindings"]
        EQ8 --> EQ9{"impliesActIntent(intent.kind)?"}
        EQ9 -->|Sim| EQ10["checks.actAvailable = actAvailable===true"]
        EQ9 -->|Não| EQ11["checks.actAvailable = true"]
        EQ10 --> EQ12["Coletar blockers dos checks que falharam"]
        EQ11 --> EQ12
        EQ2 --> EQ12
        EQ12 --> EQ13["Retornar QualityVerdict"]
    end
    V -.-> EQ1

    %% detalhe do runAcrossWorkspaces
    subgraph RAW["runAcrossWorkspaces()"]
        direction TB
        RAW1(["Início"]) --> RAW2["loadWorkspaces()"]
        RAW2 --> RAW3["Filtrar workspaces alvo por ids"]
        RAW3 --> RAW4["Loop: para cada workspace"]
        RAW4 --> RAW5["try runPipeline(...)"]
        RAW5 --> RAW6{"Sucesso?"}
        RAW6 -->|Sim| RAW7["Adicionar resumo do resultado"]
        RAW6 -->|Não| RAW8["Capturar erro, adicionar resultado de erro"]
        RAW7 --> RAW4
        RAW8 --> RAW4
        RAW4 --> RAW9["Todos os workspaces processados"]
        RAW9 --> RAW10(["Retornar RunAcrossResult"])
    end

    %% detalhe do authorizeMcpTool
    subgraph AUTH["authorizeMcpTool()"]
        direction TB
        AU1(["Início"]) --> AU2["Resolver privilégio do chamador"]
        AU2 --> AU3["Resolver privilégio exigido pela tool"]
        AU3 --> AU4{"exigido == HUMAN_APPROVAL_REQUIRED?"}
        AU4 -->|Sim| AU5["Negar: human-approval-required"]
        AU4 -->|Não| AU6{"rank do chamador < rank exigido?"}
        AU6 -->|Sim| AU7["Negar: insufficient-privilege"]
        AU6 -->|Não| AU8{"exigido==PRIVILEGED & sem flag de allow?"}
        AU8 -->|Sim| AU9["Negar: privileged-not-enabled"]
        AU8 -->|Não| AU10{"consentimento SAFE_WRITE exigido & env ausente?"}
        AU10 -->|Sim| AU11["Negar: mcp-safe-write-consent"]
        AU10 -->|Não| AU12["Permitir"]
    end
```

## 2. Diagrama de classes — modelo conceitual do prompt de auditoria

```mermaid
classDiagram
    class DefinicaoDoPrompt {
        +String id
        +String titulo
        +String dominio
        +String proposito
        +String[] tags
        +int versao
        +String status
        +String idioma
        +boolean prontoParaIA
        +String[] docsRelacionados
        +String[] promptsRelacionados
        +Date criadoEm
        +Date atualizadoEm
    }

    class ConfiguracaoDeVinculo {
        +String repoRemoto
        +String workspaceLocal
        +String branchDeReferencia
        +String commitSha
        +String caminhoEvidencias
        +boolean cloneNaoPermitido
        +String referenciaPolicies
        +getCaminhoEvidencias() String
    }

    class RegraDeDeduplicacao {
        +String promptExistente
        +String condicaoDeUso
        +String condicaoParaEvitar
    }

    class MatrizAderenciaProposito {
        +String propositoDeclarado
        +String implementacaoEncontrada
        +boolean executavel
        +boolean testado
        +String evidencia
        +StatusEnum status
        +avaliar() StatusEnum
    }

    class StatusEnum {
        <<enumeration>>
        IMPLEMENTADO_E_VALIDADO
        IMPLEMENTADO_MAS_NAO_VALIDADO
        PARCIALMENTE_IMPLEMENTADO
        DOCUMENTADO_MAS_NAO_IMPLEMENTADO
        IMPLEMENTADO_MAS_DESCONECTADO
        MOCK_STUB
        EXPERIMENTAL
        QUEBRADO
        NAO_LOCALIZADO
    }

    class VeredictoExecucao {
        <<enumeration>>
        PASS
        FAIL
        PARTIAL
        NOT_VERIFIED
        NOT_APPLICABLE
        BLOCKED
    }

    class FluxoDoSistema {
        +String[] etapas
        +compararTeoricoVsImplementado() String
    }

    class JornadaDoUsuario {
        +String nome
        +String cenario
        +VeredictoExecucao veredicto
        +String evidencia
        +documentar() void
    }

    class AuditoriaDePlugin {
        +String responsabilidade
        +String contrato
        +String io
        +String gatilho
        +String caminhoDeDiscovery
        +boolean pluginMorto
        +boolean contornaGovernanca
        +auditar() void
    }

    class VerificacaoPolicyGovernanca {
        +String policyId
        +String mudancaDeComportamento
        +String tipoDeGovernanca
        +provarMudancaDeComportamento() boolean
    }

    class VerificacaoContextoMemoriaProvider {
        +String origemDoContexto
        +String cicloDeVidaDaMemoria
        +String comparacaoDeProvider
        +VeredictoExecucao veredicto
    }

    class ValidacaoDeInterface {
        +String nomeDaInterface
        +String[] toolsAmostradas
        +VeredictoExecucao veredicto
        +validar() VeredictoExecucao
    }

    class AchadoDeTeatro {
        +String tipoDeTeatro
        +String evidencia
        +String local
        +detectar() boolean
    }

    class ClassificacaoUX {
        <<enumeration>>
        Fraca
        Basica
        Utilizavel
        Boa
        ProntaParaProducao
        Excepcional
    }

    class CicloDaRealidade {
        +String[] fases
        +executarCiclo() void
    }

    class ItemDoScorecard {
        +String area
        +int nota
        +String justificativa
    }

    class ItemDaMatrizDeLacunas {
        +String lacuna
        +String prioridade
        +String recomendacao
    }

    class RelatorioDeValidacao {
        +String resumoExecutivo
        +MatrizAderenciaProposito[] matrizProposito
        +JornadaDoUsuario[] jornadas
        +AuditoriaDePlugin[] plugins
        +VerificacaoPolicyGovernanca[] policies
        +AchadoDeTeatro[] achadosDeTeatro
        +ItemDoScorecard[] scorecard
        +ItemDaMatrizDeLacunas[] lacunas
        +String veredictoFinal
        +gerar() String
    }

    DefinicaoDoPrompt --* ConfiguracaoDeVinculo : configura
    DefinicaoDoPrompt --* RegraDeDeduplicacao : referencia
    DefinicaoDoPrompt ..> RelatorioDeValidacao : produz

    RelatorioDeValidacao --* MatrizAderenciaProposito : contém
    RelatorioDeValidacao --* JornadaDoUsuario : contém
    RelatorioDeValidacao --* AuditoriaDePlugin : contém
    RelatorioDeValidacao --* VerificacaoPolicyGovernanca : contém
    RelatorioDeValidacao --* AchadoDeTeatro : contém
    RelatorioDeValidacao --* ItemDoScorecard : contém
    RelatorioDeValidacao --* ItemDaMatrizDeLacunas : contém
    RelatorioDeValidacao --* VerificacaoContextoMemoriaProvider : contém
    RelatorioDeValidacao --* ValidacaoDeInterface : contém

    MatrizAderenciaProposito --> StatusEnum : usa
    JornadaDoUsuario --> VeredictoExecucao : usa
    VerificacaoContextoMemoriaProvider --> VeredictoExecucao : usa
    ValidacaoDeInterface --> VeredictoExecucao : usa

    FluxoDoSistema ..> MatrizAderenciaProposito : informa
    CicloDaRealidade ..> RelatorioDeValidacao : governa
    ClassificacaoUX ..> RelatorioDeValidacao : classifica
```
