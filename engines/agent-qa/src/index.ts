import { isTestPath } from '@aios/shared';
import type { AgentResult, ContextBundle, Intent } from '@aios/shared';

/** QA Agent — heurística Fase 1 (sinais de teste no contexto). */
export async function runQaAgent(intent: Intent, context?: ContextBundle): Promise<AgentResult> {
  const paths = context?.snippets.map((s) => s.path) ?? [];
  const findings: string[] = [`intent:${intent.kind}`];
  // Snippets skip `*.test.*` on purpose (budget); `testFiles` carries those paths (paths only).
  const tests = [...new Set([...(context?.testFiles ?? []), ...paths.filter(isTestPath)])];

  // `testFiles` is capped; the Context Engine's `tests:<N>` signal carries the true total.
  const signalTotal = Number(
    context?.signals.find((sig) => /^tests:\d+$/.test(sig))?.slice('tests:'.length) ?? 0
  );
  const testCount = Math.max(tests.length, signalTotal);

  if (testCount > 0) {
    findings.push(`tests:found:${testCount}`);
  } else {
    findings.push('gap:no-test-files-in-context');
  }

  if (context?.snippets.length) {
    findings.push(`context.snippets:${context.snippets.length}`);
  }
  if (intent.kind === 'review.change') {
    findings.push('focus:regression-risk');
  }
  if (intent.kind === 'analyze.project') {
    findings.push('focus:coverage-baseline');
  }

  return {
    agentId: 'qa',
    ok: true,
    findings,
    references: tests.slice(0, 3),
  };
}
