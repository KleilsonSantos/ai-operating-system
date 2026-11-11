---
id: prompt.observability.runtime-observability-gap-tracking
title: Runtime observability gap — revisit trigger
domain: observability
purpose: Revisit whether apps/console or apps/mcp need a runtime observability engine and a DevOps/infra checklist once either ships as a continuously deployed service
tags: [observability, deferred, roadmap, devops]
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - ../../../ROADMAP.md
  - ../../../guides/delivery-observability.md
  - ../../../adr/0028-delivery-ci-observability.md
related_prompts: []
created_at: 2026-11-07
updated_at: 2026-11-07
---

## Purpose

Tracks a deliberately deferred decision (see `ROADMAP.md` → "Deferred (trigger-gated)") so it resurfaces instead of being forgotten.

## Trigger to revisit

Any of `apps/console`, `apps/mcp`, or a new app starts running as a continuously deployed service (not just a CLI/library consumed on demand).

## What to do when triggered

Design a runtime observability engine (beyond the existing Prometheus text export, #130/ADR-0021) and a DevOps/infra review checklist, mirroring the pattern already proven in VaultSpring (`.github/agents/observability-reviewer.agent.md`, `devops-reviewer.agent.md`) rather than inventing a new shape from scratch.
