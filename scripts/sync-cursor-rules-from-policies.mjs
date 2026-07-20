#!/usr/bin/env node
/**
 * Gera .cursor/rules a partir de policies/aios.policies.json
 * (ponte chat Cursor ↔ AIOS — fonte única de verdade).
 *
 * Uso: node scripts/sync-cursor-rules-from-policies.mjs
 * ou:  pnpm sync:cursor-rules
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const policiesPath = join(root, 'policies', 'aios.policies.json');
const outDir = join(root, '.cursor', 'rules');

if (!existsSync(policiesPath)) {
  console.error('Missing', policiesPath);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(policiesPath, 'utf8'));
const policies = Array.isArray(raw) ? raw : raw.policies;
if (!Array.isArray(policies) || policies.length === 0) {
  console.error('No policies found in', policiesPath);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const must = policies.filter((p) => p.severity === 'must');
const should = policies.filter((p) => p.severity === 'should');
const may = policies.filter((p) => p.severity === 'may');

function bullets(list) {
  return list.map((p) => `- **${p.id}** (${p.severity}): ${p.description}`).join('\n');
}

const policiesRule = `---
description: AIOS policies — injected into every Cursor Agent chat (source policies/aios.policies.json)
alwaysApply: true
---

# AIOS Policies (chat bridge)

Estas regras vêm do **Policy Engine** (\`policies/aios.policies.json\`).
O usuário digita pedidos **curtos**; você **não** pede que ele repita best practices.

Regenerar: \`pnpm sync:cursor-rules\`

## MUST

${bullets(must)}
${should.length ? `\n## SHOULD\n\n${bullets(should)}\n` : ''}${may.length ? `\n## MAY\n\n${bullets(may)}\n` : ''}
## Comportamento no chat

1. Aplique as policies acima em toda sugestão de código, review e plano.
2. Não peça ao usuário para colar "siga boas práticas / commits / sem depreciação".
3. Se uma policy conflitar com o pedido, diga o trade-off e proponha o caminho alinhado.
4. Fonte canônica de produto: \`docs/FOUNDATION.md\` > resumos.
5. Docs de produto novas/editadas em **US English** (\`docs-language-en\` / ADR-0018); chat com o owner pode ser PT.
`;

const sdlcRule = `---
description: AIOS SDLC — Git flow, commits, ROADMAP discipline for this repo
alwaysApply: true
---

# AIOS SDLC (este repositório)

Espelha \`AGENTS.md\` + policies de fluxo. Aplicar em todo Agent chat neste workspace.

## Git

- Issue → branch semântico (\`feature/*\`, \`fix/*\`, \`docs/*\`, \`chore/*\`, \`ci/*\`) a partir de \`sandbox\` → PR para \`sandbox\` → PR de promoção \`sandbox\` → \`main\`
- Não push force em \`main\`/\`sandbox\`
- Commits só quando o humano pedir (exceto bootstrap autorizado)

## Commits

- Formato: \`type: <gitmoji> …\`
- Author: Kleilson Santos \`<kdsddesign1@gmail.com>\`
- Sem \`Co-authored-by: Cursor\` / trailers de IDE
- **Merges:** \`bash scripts/merge-pr.sh <n>\` (obrigatório subject \`merge: 🔀 PR #<n> — <branch>\`). Nunca \`gh pr merge\` sem \`--subject\` / \`-t\`.

## Produto

- AIOS é standalone (ADR-0001); agents = plugins
- Não implementar todos os engines de uma vez — seguir \`docs/ROADMAP.md\`
- CHANGELOG \`[Unreleased]\` se notável; branchs de trabalho abrem PR para \`sandbox\`, e a promoção final abre PR de \`sandbox\` para \`main\`

## Checklist rápido

- Alinhado à fase do ROADMAP?
- ADR se decisão arquitetural?
- Policies (não prompts longos) para regras permanentes?
- Docs novas/editadas em US English (ADR-0018)?
`;

writeFileSync(join(outDir, 'aios-policies.mdc'), policiesRule);
writeFileSync(join(outDir, 'aios-sdlc.mdc'), sdlcRule);

const stamp = {
  generatedAt: new Date().toISOString(),
  source: 'policies/aios.policies.json',
  policyCount: policies.length,
  files: ['aios-policies.mdc', 'aios-sdlc.mdc'],
};
writeFileSync(join(outDir, '.sync-meta.json'), `${JSON.stringify(stamp, null, 2)}\n`);

console.log(`Synced ${policies.length} policies → ${outDir}`);
