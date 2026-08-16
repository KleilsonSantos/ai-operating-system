import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ContextBundle, Intent, IntentKind } from '@aios/shared';
import { runDocsAgent } from './index.ts';

function intent(kind: IntentKind): Intent {
  return { kind, raw: 'test', confidence: 1, signals: ['t'] };
}

function bundle(snippets: ContextBundle['snippets']): ContextBundle {
  return { repoPath: '/tmp/r', scope: '.', snippets, signals: [] };
}

describe('runDocsAgent', () => {
  it('flags missing README in context', async () => {
    const out = await runDocsAgent(intent('analyze.project'));
    assert.equal(out.agentId, 'docs');
    assert.equal(out.ok, true);
    assert.ok(out.findings.includes('gap:readme-missing-in-context'));
    assert.ok(out.findings.includes('gap:foundation-missing-in-context'));
  });

  it('records README and FOUNDATION when present', async () => {
    const out = await runDocsAgent(
      intent('analyze.project'),
      bundle([
        { path: 'README.md', kind: 'doc', content: '# X', bytes: 3 },
        { path: 'docs/FOUNDATION.md', kind: 'doc', content: '# F', bytes: 3 },
      ])
    );
    assert.ok(out.findings.includes('docs:readme-present'));
    assert.ok(out.findings.includes('docs:foundation-present'));
    assert.ok(out.findings.some((f) => f.startsWith('docs:doc-snippets:')));
    assert.deepEqual(out.references, ['README.md', 'docs/FOUNDATION.md']);
  });

  it('adds explain focus', async () => {
    const out = await runDocsAgent(intent('explain.code'));
    assert.ok(out.findings.includes('focus:explain-with-official-docs'));
  });
});
