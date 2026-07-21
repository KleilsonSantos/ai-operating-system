import type { AgentResult, ContextBundle, Intent } from '@aios/shared';

/** Docs Agent — heurística Fase 1 (presença de docs oficiais no bundle). */
export async function runDocsAgent(intent: Intent, context?: ContextBundle): Promise<AgentResult> {
  const paths = context?.snippets.map((s) => s.path) ?? [];
  const findings: string[] = [`intent:${intent.kind}`];
  const refs: string[] = [];

  const readme = paths.find((p) => /(^|\/)readme(\.md)?$/i.test(p));
  const foundation = paths.find((p) => /foundation\.md$/i.test(p));

  if (readme) {
    findings.push('docs:readme-present');
    refs.push(readme);
  } else {
    findings.push('gap:readme-missing-in-context');
  }

  if (foundation) {
    findings.push('docs:foundation-present');
    refs.push(foundation);
  } else if (intent.kind === 'analyze.project') {
    findings.push('gap:foundation-missing-in-context');
  }

  if (context?.snippets.some((s) => s.kind === 'doc')) {
    findings.push(`docs:doc-snippets:${context.snippets.filter((s) => s.kind === 'doc').length}`);
  }

  if (intent.kind === 'explain.code') {
    findings.push('focus:explain-with-official-docs');
  }

  return {
    agentId: 'docs',
    ok: true,
    findings,
    references: refs.slice(0, 3),
  };
}
