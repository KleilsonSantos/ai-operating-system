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

  it('sees tests that the context carries by path only (snippets skip *.test.*)', async () => {
    const out = await runQaAgent(intent('review.change'), {
      ...bundle([]),
      testFiles: ['engines/policy/src/policy.test.ts', 'engines/policy/src/other.spec.ts'],
      signals: ['tests:2'],
    });
    assert.ok(out.findings.includes('tests:found:2'));
    assert.ok(!out.findings.includes('gap:no-test-files-in-context'));
    assert.deepEqual(out.references, [
      'engines/policy/src/policy.test.ts',
      'engines/policy/src/other.spec.ts',
    ]);
  });

  it('reports the true total from the context signal when testFiles is capped', async () => {
    const paths = Array.from({ length: 20 }, (_, i) => `a/t${i}.test.ts`);
    const out = await runQaAgent(intent('analyze.project'), {
      ...bundle([]),
      testFiles: paths,
      signals: ['tests:57'],
    });
    assert.ok(out.findings.includes('tests:found:57'));
  });

  it('does not double count a spec file present in both snippets and testFiles', async () => {
    const out = await runQaAgent(intent('analyze.project'), {
      ...bundle([{ path: 'src/a.spec.ts', kind: 'code', content: 'x', bytes: 1 }]),
      testFiles: ['src/a.spec.ts'],
      signals: ['tests:1'],
    });
    assert.ok(out.findings.includes('tests:found:1'));
  });
});
