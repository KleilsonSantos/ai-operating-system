import type { AgentResult, ContextBundle, Intent } from '@aios/shared';

function paths(context?: ContextBundle): string[] {
  return context?.snippets.map((s) => s.path) ?? [];
}

/** Architecture Agent — heurística Fase 1 sobre árvore / intent. */
export async function runArchitectureAgent(
  intent: Intent,
  context?: ContextBundle
): Promise<AgentResult> {
  const refs = paths(context).slice(0, 5);
  const findings: string[] = [`intent:${intent.kind}`];
  const p = refs.join(' ');

  if (context?.snippets.length) {
    findings.push(`context.snippets:${context.snippets.length}`);
  }
  if (/engines\/|packages\/|apps\//.test(p)) {
    findings.push('layout:monorepo-detected');
  }
  if (!refs.some((x) => /package\.json$/i.test(x))) {
    findings.push('gap:no-package-json-in-scope');
  } else {
    findings.push('signal:manifest-present');
  }
  if (intent.kind === 'explain.code') {
    findings.push('focus:explain-boundaries');
  }
  if (intent.kind === 'review.change') {
    findings.push('focus:review-coupling');
  }

  return {
    agentId: 'architecture',
    ok: true,
    findings,
    references: refs.slice(0, 3),
  };
}
