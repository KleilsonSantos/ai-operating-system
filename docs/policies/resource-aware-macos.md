# Resource-Aware Development Policy (macOS)

> **Status:** CANÓNICA  
> **Produto:** AIOS  
> **Fonte operacional curta:** `policies/aios.policies.json` (`resource-*`)  
> **ADR:** [ADR-0011](../adr/0011-resource-aware-macos.md)

Objetivo: maximizar produtividade e qualidade com o **menor consumo possível** de hardware (CPU, RAM, disco, I/O, bateria, processos, containers, serviços concorrentes, tempo de boot).

## Princípios

1. **Resource First** — eficiência operacional é requisito arquitetural, não otimização opcional.
2. **Nunca assumir instalação** — verificar nesta ordem: instalado → configurado → em execução → container equivalente → serviço partilhado → ferramenta semelhante → reutilização. Só então sugerir instalar.
3. **Preferir reutilização** — serviços, containers, DBs, redes, volumes, configs.
4. **Docker é preferência, não obrigação** — comparar nativo / container / VM / K8s / Podman / processo local pelo custo real.
5. **Containers com justificativa** — porquê, vantagem, custo, impacto, alternativa.
6. **Evitar serviços redundantes** — ex.: Ollama local + Ollama container; Postgres local + Postgres Docker.
7. **Verificação obrigatória do ambiente** antes de sugerir iniciar serviços.
8. **Um runtime de containers** — não Docker Desktop + Colima + OrbStack + … em paralelo.
9. **Kubernetes só quando necessário**.
10. **Menor número de processos** possível.
11. **Hardware awareness** — MacBook 16GB, IDEs, browser, possível IA local e Docker.
12. **Checklist antes de iniciar** — equivalente a correr? porta? consumo? conflito?
13. **AI Providers** — reutilizar provider / Ollama em execução / MCP / API existente; só então novo serviço.
14. **Economia de recursos** — menos de tudo; mais reutilização.
15. **Observabilidade antes da ação** — documentar estado atual.
16. **Justificativa obrigatória** — porquê, alternativas, impacto hardware/arquitetura/manutenção/consumo.

## Regra canónica

Aplica-se a arquitetura, DevOps, Docker/K8s, Ollama, MCP, AIOS, agentes, IDE, setup, CI/CD.

Nunca assumir ambiente vazio. Sempre inspecionar. Sempre reutilizar. Sempre minimizar consumo. Sempre justificar.
