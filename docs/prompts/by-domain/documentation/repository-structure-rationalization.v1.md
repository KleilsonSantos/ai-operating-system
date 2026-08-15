---
id: prompt.documentation.repository-structure-rationalization
title: Canonical repository structure, naming, and artifact rationalization
domain: documentation
purpose: Audit AIOS tree, naming, and artifact lifecycle; propose a sustainable convention without creating a second SSOT
tags:
  - documentation
  - repository-structure
  - naming
  - artifact-lifecycle
  - architecture-audit
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/FOUNDATION.md
  - docs/audits/README.md
  - docs/audits/document-rationalization-audit-2026-08.md
  - docs/adr/0003-pipeline-integration-contract.md
  - policies/aios.policies.json
  - AGENTS.md
related_prompts:
  - prompt.documentation.readme-docs-architecture-audit
  - prompt.ai-engineering.agent-runtime-evolution
created_at: 2026-08-15
updated_at: 2026-08-15
---

> **Catalog note:** A 2026-08-15 pass already produced observations and a P1/P2 slice. Living audit index: [`docs/audits/README.md`](../../../audits/README.md). Policy: `artifact-lifecycle` in [`policies/aios.policies.json`](../../../../policies/aios.policies.json). Hygiene shipped in #271. Re-run only to refresh the analysis. Do not rename, move, or delete files until explicitly authorized.

# AIOS — Canonical Repository Structure, Naming & Artifact Rationalization Audit

## ROLE

Atue como:

**Principal Software Architect + Repository Governance Engineer + Technical Documentation Architect + Codebase Maintainer.**

Realize uma auditoria estrutural, semântica e arquitetural do repositório:

`https://github.com/KleilsonSantos/ai-operating-system`

O objetivo NÃO é simplesmente "organizar arquivos".

O objetivo é estabelecer uma **convenção canônica e sustentável para a estrutura do AIOS**, impedindo que novas pastas, arquivos, documentos e artefatos sejam criados sem necessidade, sem propósito claro, duplicados ou com nomenclatura inconsistente.

---

# 1. PRINCÍPIO CENTRAL

O repositório deve obedecer ao seguinte princípio:

> **Every repository artifact must have a clear purpose, canonical location, lifecycle, owner/context, and reason to exist.**

Nenhum arquivo ou diretório deve existir apenas porque:

- foi criado durante uma tarefa;
- serviu como rascunho;
- foi usado temporariamente;
- documenta uma execução pontual que Git já consegue representar;
- duplica outro documento;
- preserva informação que já possui uma fonte canônica;
- "pode ser útil no futuro";
- facilita uma ferramenta específica sem necessidade arquitetural;
- cria aparência de organização sem função real.

---

# 2. FONTES DE VERDADE

Antes da análise, consulte:

## AIOS

- `README.md`
- `AGENTS.md`
- `docs/FOUNDATION.md`
- `docs/architecture/`
- `docs/adr/`
- `docs/audits/`
- `docs/guides/`
- `docs/prompts/`
- `docs/references/`
- `docs/spikes/`
- `engines/`
- `apps/`
- `packages/`
- `policies/`
- `.github/`
- `.cursor/`
- `.trae/`
- scripts
- package manifests
- configuration files
- CI/CD

## External authoritative guidance

Use como referências de naming, repository organization e documentation architecture:

- Google Developer Documentation Style Guide
- GitHub repository/documentation guidance
- GitLab documentation repository structure
- Diátaxis, quando aplicável à organização documental

As fontes externas servem como **guidance**, não como regras absolutas.

Primeiro prevalece a coerência arquitetural específica do AIOS.

---

# 3. AUDITORIA COMPLETA DO TREE

Mapeie todo o repository tree.

Para cada:

```text
directory
file
configuration
script
documentation
prompt
ADR
audit
spike
template
generated artifact
```

determine:

```text
Path
Type
Purpose
Domain
Owner/context
Lifecycle
Canonical?
Referenced?
Referenced by?
Duplicated?
Potentially obsolete?
Date-coupled?
Naming compliant?
Location compliant?
```

Não inferir propósito apenas pelo nome.

Leia o conteúdo quando necessário.

---

# 4. EMPTY DIRECTORIES

Verifique explicitamente diretórios vazios.

Importante:

Git normalmente não versiona diretórios vazios.

Portanto, não afirmar que um diretório é "empty" apenas porque determinada ferramenta não retornou arquivos.

Determine:

```text
Directory tracked by Git?
Directory represented only through tooling?
Directory contains hidden/generated artifacts?
Directory has no tracked content?
```

Caso exista um diretório sem conteúdo rastreável:

Classifique:

```text
REMOVE
KEEP_WITH_JUSTIFICATION
RESTRUCTURE
TOOL_GENERATED
NOT_REALLY_TRACKED
```

Não criar `.gitkeep` automaticamente.

Um `.gitkeep` somente é aceitável se existir uma razão arquitetural explícita para preservar a estrutura vazia.

---

# 5. FILES SEM PROPÓSITO CLARO

Identifique arquivos que:

- não possuem consumidores;
- não são referenciados;
- não fazem parte de runtime;
- não são documentação oficial;
- não são configuração;
- não são testes;
- não são evidência necessária;
- não são templates;
- não são ADR;
- não são artefatos intencionalmente versionados.

Classifique:

```text
CANONICAL
SUPPORTING
HISTORICAL
GENERATED
TEMPORARY
ORPHAN
DUPLICATE
OBSOLETE
UNJUSTIFIED
```

Nunca recomendar remoção apenas por não haver referência textual.

Analise também:

- package scripts;
- imports;
- dynamic references;
- CI;
- shell scripts;
- links;
- documentation navigation;
- tooling conventions;
- configuration discovery;
- MCP;
- agents;
- prompts;
- workflows.

---

# 6. NOMENCLATURA

Estabeleça uma convenção canônica.

## Default

Para novos arquivos e diretórios:

```text
lowercase
kebab-case
ASCII
sem espaços
sem acentos
sem camelCase
sem PascalCase
sem underscores
```

Exemplos:

```text
production-readiness.md
document-rationalization.md
agent-runtime.md
model-routing.md
context-engine.md
quality-gates.md
```

Evitar:

```text
ProductionReadiness.md
production_readiness.md
Production-Readiness.md
productionReadiness.md
produção-readiness.md
```

---

# 7. DATAS EM FILE NAMES

Esta é uma regra crítica.

Analise todos os nomes que contenham:

```text
YYYY
YYYY-MM
YYYY-MM-DD
MM-DD
date
dated
timestamp
version-date
```

Exemplos:

```text
production-readiness-audit-2026-07.md
document-rationalization-audit-2026-08.md
architecture-review-2026-08-15.md
```

Não classifique automaticamente como erro.

Determine a natureza do artefato.

## Regra canônica

### A. Documento vivo/canônico

A data NÃO pertence ao nome.

Preferir:

```text
production-readiness-audit.md
document-rationalization.md
architecture-review.md
```

O histórico fica no Git.

### B. Documento histórico

Data pode permanecer quando a identidade do artefato depende explicitamente de um snapshot temporal.

Exemplo legítimo:

```text
incident-report-2026-08-15.md
```

quando o documento representa um incidente específico daquela data.

### C. Evidência imutável

Data pode ser apropriada quando representa:

- snapshot;
- evidência;
- relatório de execução;
- export;
- compliance record;
- incidente;
- benchmark;
- resultado reproduzível de uma determinada execução.

### D. Documento que está usando data apenas para versionamento

Não usar data.

Migrar para:

```text
Git history
ADR
CHANGELOG
release
version metadata
```

conforme o caso.

---

# 8. CASO ESPECÍFICO DO AIOS

Audite especialmente:

```text
docs/audits/document-rationalization-audit-2026-08.md
```

Determine se:

```text
document-rationalization-audit.md
```

seria semanticamente superior.

Antes de renomear, verifique:

- links internos;
- referências;
- scripts;
- prompts;
- CI;
- documentação;
- histórico;
- intenção do documento;
- existência de outras versões;
- se representa snapshot ou documento vivo.

Não assumir que a data é errada.

Produzir uma decisão baseada no lifecycle real.

---

# 9. ADRs

O AIOS já possui uma estrutura de ADR:

```text
docs/adr/
```

e arquivos numerados como:

```text
0001-...
0002-...
...
```

Preserve esse mecanismo.

Não criar:

```text
architecture-decision-2026-08.md
decision-2026-08.md
architecture-decision-v2-2026.md
```

quando o artefato semanticamente representa uma decisão arquitetural.

Determinar se o conteúdo pertence a:

```text
ADR
Architecture documentation
Guide
Audit
Spike
Reference
```

e não permitir sobreposição sem justificativa.

---

# 10. AUDITS

Auditorias precisam ter lifecycle definido.

Diferenciar:

```text
audit definition
audit methodology
audit result
audit snapshot
audit history
```

Exemplo:

```text
docs/audits/
├── README.md
├── repository-structure.md
├── documentation-rationalization.md
└── security-review.md
```

vs.

```text
repository-structure-audit-2026-07.md
repository-structure-audit-2026-08.md
repository-structure-audit-2026-09.md
```

Determine qual modelo realmente corresponde ao AIOS.

Não transformar `docs/audits/` em um diretório de snapshots intermináveis.

---

# 11. SPIKES

Audite `docs/spikes/`.

Determine se cada spike ainda representa:

- investigação ativa;
- decisão pendente;
- experimento;
- prova de conceito;
- comparação tecnológica.

Se o spike resultou em uma decisão permanente:

avaliar migração de conhecimento relevante para:

```text
docs/adr/
docs/architecture/
docs/guides/
```

O spike original pode permanecer somente se possuir valor histórico ou contextual real.

---

# 12. PROMPTS

Audite:

```text
docs/prompts/
```

Verifique:

- prompts duplicados;
- prompts superseded;
- templates redundantes;
- versões `.v1`, `.v2`, `.v3`;
- prompts que deveriam ser Skills;
- prompts que deveriam ser Policies;
- prompts que deveriam ser Agents;
- prompts que são documentação e não prompts;
- prompts sem consumidor.

Não remover versões automaticamente.

Determinar se versionamento é realmente necessário.

---

# 13. README.md

Verifique se cada README possui função real.

Não criar README apenas porque uma pasta existe.

Um README deve existir quando serve como:

- entry point;
- navigation;
- usage guide;
- architectural explanation;
- contribution guidance;
- module documentation.

Quando uma estrutura possui documentação hierárquica, avaliar se:

```text
README.md
```

ou:

```text
_index.md
```

é o mecanismo mais coerente.

Não misturar padrões arbitrariamente.

---

# 14. DUPLICAÇÃO SEMÂNTICA

Procure conteúdos que expressem essencialmente a mesma informação.

Exemplo:

```text
docs/architecture/system-guide.md
docs/references/DESIGN.md
docs/FOUNDATION.md
docs/adr/...
```

Não assumir duplicação apenas pelo nome.

Compare conteúdo.

Classifique:

```text
TRUE_DUPLICATE
PARTIAL_OVERLAP
COMPLEMENTARY
CANONICAL + DERIVED
INTENTIONALLY_REPEATED
NO_OVERLAP
```

Quando houver duplicação:

preferir:

```text
single source of truth
```

e links para a fonte canônica.

---

# 15. ARQUIVOS DE AUDITORIA QUE AUDITAM AUDITORIAS

Identifique padrões como:

```text
audit
audit-v2
audit-final
audit-final-v2
audit-2026
audit-2026-08
audit-final-2026-08
```

Isso deve ser tratado como smell arquitetural.

Em vez disso, determinar:

```text
canonical document
Git history
ADR
CHANGELOG
snapshot
evidence
```

e escolher apenas um mecanismo.

---

# 16. "FINAL", "NEW", "LATEST", "TEMP", "OLD"

Procurar nomes contendo:

```text
final
latest
new
newest
old
old-version
backup
tmp
temp
draft
copy
copy-2
v2
v3
```

Não assumir automaticamente que devem ser removidos.

Determinar o significado real.

Exemplo:

```text
final-architecture.md
latest-plan.md
new-readme.md
backup.md
document-copy.md
```

normalmente são sinais de lifecycle inadequado.

O conteúdo deve migrar para um nome canônico e o histórico deve ficar no Git.

---

# 17. ARQUIVOS GERADOS

Identificar:

```text
generated
dist
build
coverage
cache
reports
exports
artifacts
snapshots
logs
```

Determinar se cada um deve ser:

```text
tracked
ignored
generated-on-demand
CI artifact
release artifact
documentation
```

Não versionar artefatos gerados sem necessidade.

Não remover arquivos gerados se fizerem parte de uma distribuição oficial.

---

# 18. CONFIGURAÇÕES DE FERRAMENTAS

Auditar:

```text
.cursor/
.trae/
.github/
.githooks/
```

Não considerar essas pastas "lixo" simplesmente por serem tool-specific.

Determinar:

- qual ferramenta consome;
- se o conteúdo é duplicado;
- se existe source of truth;
- se existe sincronização;
- se há regras divergentes;
- se há arquivos abandonados;
- se o conteúdo deveria estar em um local neutro.

Especialmente verificar:

```text
.cursor/rules/
.trae/rules/
.github/agents/
```

para identificar divergências semânticas.

---

# 19. ARTEFATOS ÓRFÃOS

Para cada arquivo importante, procure referências em:

```text
source code
imports
scripts
package.json
CI
documentation
links
agents
prompts
MCP
configuration
```

Classifique arquivos sem consumidores conhecidos como:

```text
ORPHAN-CANDIDATE
```

Nunca classificar diretamente como `DELETE`.

A ausência de referência textual não prova que um arquivo é inútil.

---

# 20. PASTAS REDUNDANTES

Identifique diretórios que possuem fronteiras semânticas fracas.

Exemplos de perguntas:

```text
docs/guides
docs/references
docs/architecture
docs/audits
docs/spikes
docs/prompts
```

Para cada um:

- qual é a finalidade?
- qual conteúdo pertence?
- qual conteúdo não pertence?
- há sobreposição?
- existe consumidor?
- a pasta deve continuar existindo?
- deve ser consolidada?
- deve possuir índice?

Não consolidar simplesmente para reduzir quantidade de pastas.

---

# 21. COMPLEXIDADE ESTRUTURAL

Calcule:

```text
directory depth
files per directory
documentation fragmentation
naming inconsistencies
duplicate concepts
special-case directories
tool-specific duplication
```

Procure por estruturas excessivamente profundas como:

```text
docs/a/b/c/d/e/file.md
```

quando poderiam ser:

```text
docs/a/file.md
```

Mas não reduzir profundidade quando ela representa corretamente um domínio.

---

# 22. CANONICAL STRUCTURE

Produza uma proposta de estrutura canônica.

Exemplo conceitual:

```text
/
├── apps/
├── engines/
├── packages/
├── policies/
├── scripts/
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── audits/
│   ├── guides/
│   ├── prompts/
│   ├── references/
│   └── spikes/
├── .github/
├── .cursor/
├── .trae/
└── ...
```

Não modificar a estrutura simplesmente para coincidir com esse exemplo.

O tree real do AIOS é a fonte de verdade.

---

# 23. REGRAS CANÔNICAS DE NOMENCLATURA

Produza um contrato explícito contendo:

```text
File naming
Directory naming
Documentation naming
ADR naming
Audit naming
Prompt naming
Skill naming
Agent naming
Script naming
Configuration naming
Test naming
Generated artifact naming
Snapshot naming
```

Para cada categoria:

```text
MUST
SHOULD
MAY
MUST NOT
```

---

# 24. ENFORCEMENT

A auditoria deve propor mecanismos para impedir regressões.

Avalie:

```text
CI
pre-commit
pre-push
lint
repository structure validator
documentation validator
naming validator
duplicate detector
orphan detector
```

Exemplo conceitual:

```text
validate-repository-structure
```

que detecte:

```text
uppercase filenames
underscores
spaces
date-suffixed canonical documents
duplicate names
invalid directory placement
temporary names
backup names
forbidden patterns
```

Mas NÃO criar um validator gigante sem necessidade.

Primeiro definir as regras.

Depois escolher o menor mecanismo capaz de garantir conformidade.

---

# 25. MACHINE-ENFORCEABLE POLICY

Proponha uma policy declarativa quando houver benefício.

Exemplo:

```text
repository.naming.yaml
```

ou integrar às policies existentes do AIOS.

Avaliar cuidadosamente antes de criar um novo arquivo.

Não criar outra fonte de verdade se:

```text
policies/aios.policies.json
```

já puder representar a regra.

---

# 26. MIGRATION STRATEGY

Para cada alteração proposta:

```text
Current
→ Proposed
→ Reason
→ References affected
→ Risk
→ Migration
→ Validation
```

Não fazer rename em massa sem atualizar:

- links;
- imports;
- scripts;
- CI;
- documentation;
- agent instructions;
- prompts;
- tooling;
- MCP;
- tests.

---

# 27. SEVERITY

Classificar cada achado:

```text
P0 — architectural violation
P1 — high-value structural inconsistency
P2 — maintainability issue
P3 — cosmetic / low impact
INFO — intentional / acceptable
```

---

# 28. DECISION MATRIX

Produzir:

| Artifact | Current Path | Category | Problem | Canonical Path | Action | Severity |
| -------- | ------------ | -------- | ------- | -------------- | ------ | -------- |

Ações permitidas:

```text
KEEP
RENAME
MOVE
MERGE
SPLIT
DELETE
ARCHIVE
GENERATE
IGNORE
DOCUMENT_EXCEPTION
```

Nunca recomendar `DELETE` sem evidência.

---

# 29. IMPORTANT — NO HALLUCINATION

Não inventar:

- arquivos;
- diretórios;
- dependências;
- referências;
- consumidores;
- funcionalidades;
- motivos históricos;
- intenções do autor.

Se não for possível determinar:

```text
UNKNOWN
```

e explicar qual evidência seria necessária.

Diferenciar sempre:

```text
OBSERVED
INFERRED
RECOMMENDED
UNKNOWN
```

---

# 30. IMPORTANT — NÃO DEPRECIAR O PROJETO

Não avaliar a estrutura com linguagem depreciativa.

Evitar:

```text
messy
bad
amateur
wrong
poorly designed
garbage
```

Preferir:

```text
inconsistent
non-canonical
ambiguous
duplicated
historically evolved
needs clarification
candidate for consolidation
```

O objetivo é evolução arquitetural, não julgamento.

---

# 31. IMPORTANT — NÃO CRIAR REDUNDÂNCIA

Antes de recomendar:

```text
new directory
new index
new policy
new validator
new README
new audit
new metadata file
```

verifique se uma estrutura existente já atende à necessidade.

Regra:

> **Prefer extending an existing canonical mechanism over introducing another mechanism.**

---

# 32. FINAL OUTPUT

Entregue obrigatoriamente:

## A. Repository Structure Assessment

Resumo da estrutura atual.

## B. Naming Assessment

Inconsistências reais encontradas.

## C. Date-in-Filename Assessment

Lista de arquivos contendo datas e classificação:

```text
CANONICAL-LIVE
HISTORICAL
SNAPSHOT
EVIDENCE
JUSTIFIED
UNJUSTIFIED
```

## D. Empty / Orphan Analysis

Arquivos e diretórios candidatos.

## E. Duplication Analysis

Conteúdo duplicado ou parcialmente sobreposto.

## F. Directory Rationalization

Diretórios:

```text
KEEP
CONSOLIDATE
MOVE
RENAME
REMOVE
```

## G. Canonical Naming Policy

Contrato definitivo para novos artefatos.

## H. Enforcement Strategy

Como impedir regressões.

## I. Migration Plan

Mudanças recomendadas em ordem de prioridade.

## J. Exception Register

Exceções justificadas que devem permanecer.

---

# 33. FINAL CANONICAL RULE

Ao final da auditoria, estabelecer esta regra operacional:

> **Before creating any file or directory, determine its semantic domain, canonical location, lifecycle, consumer, and whether an existing artifact already fulfills the same purpose.**

E:

> **Do not use filenames as a substitute for version control.**

Portanto:

```text
Git history
    ↓
evolution

ADR
    ↓
architectural decision

CHANGELOG
    ↓
release history

Snapshot / Evidence
    ↓
date may be part of identity

Canonical documentation
    ↓
stable semantic filename
```

---

# 34. EXECUTION CONSTRAINT

Primeiro execute somente a auditoria.

NÃO renomeie, mova, exclua ou crie arquivos automaticamente.

Produza:

```text
observations
evidence
classification
recommendations
migration plan
```

e aguarde autorização explícita antes de qualquer alteração.

A auditoria deve terminar com uma resposta objetiva:

> **"Qual é a estrutura canônica que o AIOS deve adotar daqui para frente e quais mecanismos impedirão que a estrutura volte a degradar?"**
