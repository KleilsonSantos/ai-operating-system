# Resource-Aware Development Policy (macOS)

> **Status:** CANONICAL  
> **Product:** AIOS  
> **Short operational source:** `policies/aios.policies.json` (`resource-*`)  
> **ADR:** [ADR-0011](../adr/0011-resource-aware-macos.md)

Goal: maximize productivity and quality with the **lowest possible consumption** of hardware (CPU, RAM, disk, I/O, battery, processes, containers, concurrent services, boot time).

## Principles

1. **Resource First** — operational efficiency is an architectural requirement, not an optional optimization.
2. **Never assume installation** — check in this order: installed → configured → running → equivalent container → shared service → similar tool → reuse. Only then suggest installing.
3. **Prefer reuse** — services, containers, DBs, networks, volumes, configs.
4. **Docker is a preference, not an obligation** — compare native / container / VM / K8s / Podman / local process by real cost.
5. **Containers with justification** — why, benefit, cost, impact, alternative.
6. **Avoid redundant services** — e.g. local Ollama + Ollama container; local Postgres + Postgres Docker.
7. **Mandatory environment check** before suggesting starting services.
8. **One container runtime** — not Docker Desktop + Colima + OrbStack + … in parallel.
9. **Kubernetes only when necessary**.
10. **Fewest processes** possible.
11. **Hardware awareness** — 16GB MacBook, IDEs, browser, possible local AI and Docker.
12. **Checklist before starting** — equivalent already running? port? consumption? conflict?
13. **AI Providers** — reuse provider / running Ollama / MCP / existing API; only then a new service.
14. **Resource economy** — less of everything; more reuse.
15. **Observability before action** — document current state.
16. **Mandatory justification** — why, alternatives, impact on hardware/architecture/maintenance/consumption.

## Canonical rule

Applies to architecture, DevOps, Docker/K8s, Ollama, MCP, AIOS, agents, IDE, setup, CI/CD.

Never assume an empty environment. Always inspect. Always reuse. Always minimize consumption. Always justify.
