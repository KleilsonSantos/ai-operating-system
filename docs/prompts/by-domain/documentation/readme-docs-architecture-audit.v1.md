---
id: prompt.documentation.readme-docs-architecture-audit
title: README & documentation architecture audit
domain: documentation
purpose: Audit README vs Docs-as-Code / landing-page role; propose structure without inventing APIs
tags:
  - documentation
  - readme
  - architecture-audit
  - docs-as-code
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/FOUNDATION.md
  - README.md
  - docs/ROADMAP.md
related_prompts: []
created_at: 2026-07-18
updated_at: 2026-07-18
---
````md
# Prompt — Análise Arquitetural da Documentação e Evolução do README.md

## Objetivo

Realize uma análise arquitetural completa da estrutura de documentação do projeto, avaliando se ela segue as melhores práticas adotadas por projetos Open Source e corporativos.

A análise deve ser baseada em documentação oficial, referências da indústria e boas práticas amplamente reconhecidas, evitando opiniões pessoais ou decisões sem fundamentação.

Considere que existe uma percepção de que o arquivo `README.md` pode estar acumulando responsabilidades além do seu propósito principal.

Seu trabalho é validar tecnicamente essa hipótese.

---

# Objetivos da Análise

Avaliar se o `README.md`:

- está cumprindo corretamente seu papel;
- possui excesso de informações técnicas;
- possui excesso de documentação operacional;
- possui excesso de documentação arquitetural;
- deveria delegar parte do conteúdo para outros documentos especializados;
- está seguindo o conceito de "Landing Page" do projeto.

A resposta deve ser baseada em evidências e boas práticas da indústria, não em preferências pessoais.

---

# Etapa 1 — Analisar o Estado Atual

Analise todo o repositório.

Verifique:

- README.md
- docs/
- Wiki
- ADRs
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- SECURITY.md
- SUPPORT.md
- CHANGELOG.md
- ROADMAP.md
- LICENSE
- templates
- documentação técnica
- documentação arquitetural
- documentação operacional
- documentação para IA
- documentação de onboarding
- demais arquivos relacionados.

Identifique:

- responsabilidades duplicadas;
- responsabilidades inadequadas;
- documentação redundante;
- documentos ausentes;
- excesso de informações no README;
- problemas de organização.

---

# Etapa 2 — Validar Arquiteturalmente o README

Avalie se o README deveria funcionar principalmente como:

- apresentação do projeto;
- porta de entrada (Landing Page);
- onboarding rápido;
- visão geral;
- guia inicial de instalação;
- navegação para a documentação especializada.

Verifique se conteúdos como:

- arquitetura detalhada;
- diagramas completos;
- decisões arquiteturais;
- convenções;
- padrões internos;
- documentação de agentes;
- documentação de IA;
- runbooks;
- troubleshooting;
- observabilidade;
- monitoramento;
- DevOps;
- segurança;
- governança;
- documentação extensa;

deveriam ser movidos para arquivos próprios dentro da estrutura de documentação.

---

# Etapa 3 — Avaliação da Estrutura de Documentação

Analise se o projeto deveria adotar uma arquitetura documental semelhante às utilizadas em projetos de grande porte.

Exemplo conceitual:

```text
/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── SUPPORT.md
├── CHANGELOG.md
├── ROADMAP.md
├── LICENSE
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── development/
│   ├── ai/
│   ├── prompt-engineering/
│   ├── context-engineering/
│   ├── mcp/
│   ├── rag/
│   ├── backend/
│   ├── frontend/
│   ├── devops/
│   ├── security/
│   ├── observability/
│   ├── monitoring/
│   ├── testing/
│   ├── deployment/
│   ├── guides/
│   ├── tutorials/
│   ├── references/
│   └── adr/
```

A estrutura acima é apenas uma referência.

Caso exista uma arquitetura mais adequada, proponha-a e justifique tecnicamente.

---

# Etapa 4 — Comparação com Projetos de Referência

Utilize como uma das referências o seguinte projeto:

- https://github.com/KleilsonSantos/infra-devtools

Analise:

- organização;
- navegabilidade;
- distribuição do conteúdo;
- apresentação visual;
- separação entre README e documentação;
- usabilidade;
- experiência do desenvolvedor.

Além disso, compare com READMEs de projetos reconhecidos pela comunidade Open Source e identifique padrões recorrentes de organização e apresentação.

A comparação deve ser técnica, imparcial e baseada em evidências.

---

# Etapa 5 — Avaliação da Experiência Visual

Analise a qualidade visual do README atual.

Considere aspectos como:

- organização das seções;
- hierarquia visual;
- uso adequado de títulos;
- espaçamento;
- legibilidade;
- identidade visual;
- consistência;
- acessibilidade;
- facilidade de navegação;
- excesso ou ausência de elementos gráficos.

Avalie também:

- badges;
- banners;
- ícones;
- diagramas;
- tabelas;
- cards;
- callouts;
- índice navegável;
- links rápidos;
- quick start.

Verifique se a apresentação visual transmite uma imagem profissional compatível com um projeto moderno de Engenharia de Software e Engenharia aplicada à IA.

---

# Etapa 6 — Arquitetura Documental

Caso identifique necessidade de reorganização, proponha:

- nova arquitetura documental;
- redistribuição dos arquivos;
- criação de novos documentos;
- remoção de redundâncias;
- centralização de responsabilidades;
- padronização de nomenclatura;
- organização por domínio.

Cada documento deverá possuir uma responsabilidade única (Single Responsibility Principle aplicado à documentação).

---

# Etapa 7 — Plano de Refatoração

Caso existam melhorias, elaborar um plano incremental contendo:

- ordem de implementação;
- impacto;
- prioridade;
- dependências;
- riscos;
- benefícios.

Evitar grandes refatorações quando pequenas evoluções forem suficientes.

---

# Critérios Obrigatórios

Toda a análise deverá seguir rigorosamente os seguintes princípios:

- Basear todas as conclusões em documentação oficial ou boas práticas amplamente aceitas.
- Não gerar opiniões sem evidências.
- Não fazer suposições.
- Não criar recomendações sem justificativa técnica.
- Evitar redundâncias.
- Evitar depreciações do projeto atual.
- Aproveitar ao máximo a estrutura já existente.
- Reutilizar documentos sempre que possível.
- Seguir os princípios de Docs as Code.
- Seguir princípios de Arquitetura da Informação.
- Seguir princípios de Engenharia de Software.
- Seguir boas práticas de documentação para projetos Open Source e corporativos.

---

# Resultado Esperado

Ao final da análise, apresentar:

1. Avaliação completa do README atual.
2. Identificação dos pontos fortes.
3. Identificação das oportunidades de melhoria.
4. Validação técnica sobre o papel adequado do README.
5. Comparação com o projeto de referência (`infra-devtools`) e com READMEs de alta qualidade.
6. Proposta de reorganização da documentação.
7. Estrutura sugerida para a pasta `docs`.
8. Sugestão de novos documentos de apoio (quando realmente necessários).
9. Plano de migração do conteúdo existente.
10. Recomendações para evolução da identidade visual do README.
11. Justificativa técnica para cada recomendação.
12. Indicação de eventual criação de uma Issue ou Epic, caso a refatoração documental represente uma melhoria arquitetural relevante para o projeto.

**Objetivo final:** construir uma documentação modular, escalável e sustentável, em que o `README.md` funcione como uma excelente porta de entrada (Landing Page), enquanto a documentação especializada permaneça organizada em arquivos dedicados, seguindo o princípio de responsabilidade única e as melhores práticas de arquitetura documental utilizadas pela indústria.
````
