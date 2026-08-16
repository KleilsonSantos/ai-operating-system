import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ContextBundle, Intent, IntentKind } from '@aios/shared';
import { runArchitectureAgent } from './index.ts';

function intent(kind: IntentKind): Intent {
  return { kind, raw: 'test', confidence: 1, signals: ['t'] };
}

function bundle(snippets: ContextBundle['snippets']): ContextBundle {
  return { repoPath: '/tmp/r', scope: '.', snippets, signals: [] };
}

describe('runArchitectureAgent', () => {
  it('flags missing package.json in scope', async () => {
    const out = await runArchitectureAgent(intent('analyze.project'));
    assert.equal(out.agentId, 'architecture');
    assert.equal(out.ok, true);
    assert.ok(out.findings.includes('intent:analyze.project'));
    assert.ok(out.findings.includes('gap:no-package-json-in-scope'));
  });

  it('detects monorepo layout and a manifest', async () => {
    const out = await runArchitectureAgent(
      intent('analyze.project'),
      bundle([
        {
          path: 'engines/policy/package.json',
          kind: 'manifest',
          content: '{}',
          bytes: 2,
        },
      ])
    );
    assert.ok(out.findings.includes('layout:monorepo-detected'));
    assert.ok(out.findings.includes('signal:manifest-present'));
  });

  it('adds explain and review foci', async () => {
    const explain = await runArchitectureAgent(intent('explain.code'));
    assert.ok(explain.findings.includes('focus:explain-boundaries'));
    const review = await runArchitectureAgent(intent('review.change'));
    assert.ok(review.findings.includes('focus:review-coupling'));
  });
});
