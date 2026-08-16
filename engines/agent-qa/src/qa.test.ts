import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ContextBundle, Intent, IntentKind } from '@aios/shared';
import { runQaAgent } from './index.ts';

function intent(kind: IntentKind): Intent {
  return { kind, raw: 'test', confidence: 1, signals: ['t'] };
}

function bundle(snippets: ContextBundle['snippets']): ContextBundle {
  return { repoPath: '/tmp/r', scope: '.', snippets, signals: [] };
}

describe('runQaAgent', () => {
  it('flags missing tests in context', async () => {
    const out = await runQaAgent(intent('analyze.project'));
    assert.equal(out.agentId, 'qa');
    assert.equal(out.ok, true);
    assert.ok(out.findings.includes('gap:no-test-files-in-context'));
    assert.ok(out.findings.includes('focus:coverage-baseline'));
  });

  it('counts test files and returns them as references', async () => {
    const out = await runQaAgent(
      intent('review.change'),
      bundle([
        {
          path: 'src/foo.test.ts',
          kind: 'code',
          content: 'it("x", () => {})',
          bytes: 16,
        },
      ])
    );
    assert.ok(out.findings.includes('tests:found:1'));
    assert.ok(out.findings.includes('focus:regression-risk'));
    assert.deepEqual(out.references, ['src/foo.test.ts']);
  });
});
