---
id: prompt.knowledge.project-knowledge-base-evolution
title: Project knowledge base evolution analysis
domain: knowledge
purpose: Analyze whether a knowledge-base initiative is needed before creating Issues; prefer reuse of docs/ KG Memory
tags:
  - knowledge
  - architecture
  - issue-proposal
  - references
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/FOUNDATION.md
  - docs/adr/0005-knowledge-graph-heuristic.md
  - docs/adr/0006-memory-engine-session.md
related_prompts:
  - prompt.ai-engineering.prompt-knowledge-base-proposal
created_at: 2026-07-18
updated_at: 2026-07-18
---
# Prompt — Análise Arquitetural e Proposta de Evolução da Base de Conhecimento do Projeto

## Objetivo

Realize uma análise completa do projeto antes de qualquer implementação para verificar se existe necessidade de criação de uma nova Issue relacionada à construção de uma Base de Conhecimento (Knowledge Base).

A criação da Issue **não deve ser automática**. Primeiro, avalie o estado atual do projeto, sua arquitetura, documentação e planejamento para identificar se essa necessidade já foi contemplada ou se pode ser incorporada a alguma estrutura existente.

Caso conclua que essa iniciativa agrega valor e ainda não foi implementada, proponha uma nova Issue seguindo os padrões arquiteturais e organizacionais já adotados pelo projeto.

---

# Etapa 1 — Análise do Projeto

Realize uma análise criteriosa de todo o repositório.

Avalie, no mínimo:

- Estrutura de diretórios
- Arquitetura atual
- Organização da documentação
- Diretório `docs`
- Wiki
- ADRs (Architecture Decision Records)
- README
- CONTRIBUTING
- Issues abertas
- Issues fechadas
- GitHub Projects
- Roadmap
- Backlog
- Epics
- Features planejadas
- Templates
- Scripts
- Ferramentas
- Base de conhecimento existente (caso exista)
- Organização dos agentes de IA
- Estrutura destinada a documentação técnica
- Estrutura destinada ao RAG
- Estrutura destinada ao MCP
- Diretórios voltados para engenharia do conhecimento

Identifique possíveis sobreposições, lacunas ou oportunidades de melhoria.

---

# Etapa 2 — Avaliação da Necessidade da Issue

Após a análise, determine:

- Se realmente existe necessidade de uma nova Issue.
- Se essa funcionalidade já está parcialmente implementada.
- Se faz mais sentido evoluir alguma estrutura existente.
- Se existe uma abordagem arquitetural mais adequada.

Explique tecnicamente cada conclusão.

---

# Objetivo da Nova Funcionalidade

Caso seja recomendada sua implementação, a proposta deverá contemplar a criação de uma Base de Conhecimento corporativa para servir como fonte oficial de consulta do projeto.

Essa base deverá atender tanto aos desenvolvedores quanto aos agentes de IA, RAGs, MCPs e futuras integrações.

Ela deverá ser evolutiva, versionada e continuamente atualizada.

---

# Pesquisa de Conteúdo

Caso essa funcionalidade seja aprovada, definir um processo de pesquisa contínua na Internet para localizar materiais gratuitos, oficiais e disponibilizados legalmente.

Priorizar:

- Documentações Oficiais
- Livros gratuitos disponibilizados legalmente
- PDFs oficiais
- Whitepapers
- RFCs
- Handbooks
- Engineering Blogs
- Playbooks
- Technical Papers
- Especificações
- Guias
- Publicações acadêmicas
- Artigos técnicos

Nunca utilizar:

- conteúdo pirata;
- PDFs distribuídos ilegalmente;
- materiais sem autoria conhecida;
- fontes não confiáveis.

---

# Fontes Prioritárias

Priorizar sempre fontes oficiais ou reconhecidas internacionalmente.

Exemplos:

- Microsoft Learn
- Google Developers
- AWS Documentation
- Azure Documentation
- Oracle Documentation
- OpenAI Documentation
- Anthropic Documentation
- Docker Docs
- Kubernetes Docs
- CNCF
- Linux Foundation
- Mozilla MDN
- OWASP
- NIST
- CIS Benchmarks
- PostgreSQL Documentation
- MongoDB Documentation
- Redis Documentation
- Apache Foundation
- Spring Documentation
- Angular Documentation
- React Documentation
- Java Documentation
- W3C
- IETF
- ACM
- IEEE
- Martin Fowler
- ThoughtWorks
- InfoQ
- GitHub Official Documentation

e demais fontes reconhecidas internacionalmente.

---

# Áreas de Conhecimento

A pesquisa deverá abranger, entre outras:

## Engenharia de Software

- SOLID
- Clean Code
- Clean Architecture
- Domain Driven Design
- Design Patterns
- Refactoring
- Object Calisthenics
- Hexagonal Architecture
- Modular Monolith
- Microservices
- APIs
- REST
- GraphQL
- gRPC

---

## Engenharia aplicada à IA

- AI Engineering
- LLMs
- Multi-Agent Systems
- Prompt Engineering
- Context Engineering
- Agentic AI
- MCP
- RAG
- Embeddings
- Vector Databases
- Fine Tuning
- AI Governance
- AI Safety
- Responsible AI
- AI Observability

---

## Arquitetura

- Software Architecture
- Solution Architecture
- Enterprise Architecture
- Cloud Architecture
- Distributed Systems
- Event Driven Architecture
- Resilience
- Fault Tolerance

---

## Backend

- Java
- Spring
- Spring Boot
- Spring Cloud
- PostgreSQL
- MongoDB
- Redis
- Kafka
- RabbitMQ

---

## Frontend

- HTML
- CSS
- JavaScript
- TypeScript
- Angular
- React
- Next.js
- Tailwind CSS
- Acessibilidade

---

## Banco de Dados

- SQL
- NoSQL
- Modelagem
- Performance
- Backup
- Replicação
- Sharding
- Disaster Recovery

---

## DevOps

- Docker
- Kubernetes
- Helm
- Terraform
- GitOps
- CI/CD
- Platform Engineering
- SRE

---

## Segurança

- DevSecOps
- Secure Coding
- OWASP
- OAuth
- OpenID Connect
- JWT
- Threat Modeling
- Secrets Management
- Zero Trust
- LGPD

---

## Qualidade

- QA
- Testes Unitários
- Testes de Integração
- E2E
- TDD
- BDD
- Mutation Testing
- Contract Testing

---

## UX/UI

- UX
- UI
- Design System
- Design Thinking
- Acessibilidade
- Figma

---

## Gestão

- Product Owner
- Scrum
- Kanban
- Lean
- Engenharia de Requisitos

---

## Observabilidade

- OpenTelemetry
- Prometheus
- Grafana
- Loki
- Tempo
- Jaeger
- Elastic Stack

---

## Performance

- Escalabilidade Horizontal
- Escalabilidade Vertical
- Balanceamento de Carga
- Cache
- Performance Tuning

---

# Organização da Base de Conhecimento

Caso seja criada, proponha uma arquitetura coerente para armazenar todo esse conhecimento.

A estrutura deverá:

- seguir boas práticas de organização;
- ser escalável;
- facilitar futuras consultas;
- facilitar integração com RAG;
- facilitar integração com MCP;
- facilitar indexação;
- facilitar versionamento;
- evitar duplicidade de conteúdo;
- permitir evolução contínua.

Caso já exista alguma estrutura semelhante, proponha sua evolução em vez da criação de uma nova.

---

# Biblioteca de Prompts

Ao final da análise, proponha também uma arquitetura destinada ao armazenamento dos prompts utilizados no projeto.

Essa biblioteca deverá funcionar como um repositório de engenharia de prompts.

Considere que, futuramente, diversos prompts serão adicionados manualmente e deverão permanecer organizados de maneira consistente.

A proposta deverá incluir:

- nome adequado para a pasta;
- organização por categorias;
- organização por domínio;
- organização por finalidade;
- convenção de nomenclatura;
- versionamento;
- documentação;
- índice de navegação;
- metadados dos prompts;
- possibilidade de reutilização por agentes.

Exemplos de categorias:

- Prompt Engineering
- Context Engineering
- Code Review
- Architecture Review
- Refactoring
- QA
- DevOps
- Segurança
- Documentação
- Geração de Issues
- Planejamento
- Pesquisa
- Análise
- Automação
- IA
- RAG
- MCP

A arquitetura deverá evoluir naturalmente conforme o crescimento do projeto.

---

# Requisitos Arquiteturais

Sempre que identificar necessidade de criação de novas pastas, arquivos ou módulos:

- verificar primeiro se já existe algo equivalente;
- evitar duplicidade;
- reutilizar estruturas existentes quando possível;
- propor refatorações quando fizer sentido;
- justificar todas as decisões arquiteturais.

---

# Critérios Obrigatórios

Toda a análise deverá seguir rigorosamente os seguintes princípios:

- Basear todas as conclusões em evidências.
- Não gerar informações sem comprovação.
- Não criar referências inexistentes.
- Não fazer suposições.
- Não utilizar fontes duvidosas.
- Não utilizar materiais ilegais.
- Priorizar documentação oficial.
- Priorizar materiais atualizados.
- Seguir princípios SOLID.
- Seguir Clean Code.
- Seguir Clean Architecture.
- Seguir princípios de Engenharia de Software.
- Seguir boas práticas de Engenharia aplicada à IA.
- Evitar alucinações.
- Evitar depreciações.
- Evitar redundâncias.
- Justificar tecnicamente todas as recomendações.

---

# Resultado Esperado

Ao final da execução, apresentar:

1. Análise completa do estado atual do projeto.
2. Avaliação sobre a necessidade ou não da nova Issue.
3. Justificativa técnica para cada decisão.
4. Proposta da Issue (caso necessária).
5. Proposta arquitetural para a Base de Conhecimento.
6. Proposta arquitetural para a Biblioteca de Prompts.
7. Sugestão de estrutura de diretórios.
8. Convenções de nomenclatura.
9. Estratégia de versionamento.
10. Estratégia de evolução contínua.
11. Plano de manutenção da base de conhecimento.
12. Plano de manutenção da biblioteca de prompts.
13. Identificação de possíveis melhorias arquiteturais no projeto relacionadas a esses temas.

O objetivo final é transformar o projeto em uma plataforma com uma **Single Source of Truth (SSOT)** para conhecimento técnico e uma **Prompt Library** estruturada, escalável e preparada para suportar desenvolvedores, arquitetos, engenheiros, QA, DevOps, SRE, Product Owners, designers, agentes de IA, RAGs, MCPs e futuras evoluções do ecossistema, sempre alinhada às melhores práticas da indústria.
