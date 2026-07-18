---
id: prompt.templates.blank-task
title: Blank task prompt template
domain: templates
purpose: Skeleton for a new PKB asset — replace fields before promoting to by-domain/
tags: [template, skeleton]
version: 1
status: draft
language: en-US
ai_ready: false
related_docs:
  - docs/prompts/README.md
related_prompts: []
created_at: 2026-07-18
updated_at: 2026-07-18
---

# Prompt — \<short English title\>

## Objective

\<One paragraph: what the agent must achieve\>

## Constraints

- Prefer official docs (`official-docs` policy)
- Do not invent APIs or contracts
- Policies > long prompts — link `policies/` / ADRs instead of pasting rules
- Minimal change that solves the request (`no-overengineering`)

## Steps

1. …
2. …

## Deliverable

\<Expected output shape\>
