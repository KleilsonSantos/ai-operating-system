import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ContextBundle, Intent, IntentKind } from '@aios/shared';
import { runAppsecAgent } from './index.ts';

function intent(kind: IntentKind): Intent {
  return { kind, raw: 'test', confidence: 1, signals: ['t'] };
}

function bundle(snippets: ContextBundle['snippets']): ContextBundle {
  return { repoPath: '/tmp/r', scope: '.', snippets, signals: [] };
}

describe('runAppsecAgent', () => {
  it('reports no obvious secret patterns on empty context', async () => {
    const out = await runAppsecAgent(intent('analyze.project'));
    assert.equal(out.agentId, 'appsec');
    assert.equal(out.ok, true);
    assert.ok(out.findings.includes('scan:no-obvious-secret-patterns'));
    assert.deepEqual(out.references, []);
  });

  it('flags a password-like pattern in snippet content', async () => {
    const out = await runAppsecAgent(
      intent('analyze.project'),
      bundle([
        {
          path: 'src/config.ts',
          kind: 'code',
          content: 'const password = "demo"',
          bytes: 24,
        },
      ])
    );
    assert.ok(out.findings.includes('risk:pattern-in:src/config.ts'));
    assert.ok(out.references.includes('src/config.ts'));
  });

  it('adds review focus on review.change', async () => {
    const out = await runAppsecAgent(intent('review.change'));
    assert.ok(out.findings.includes('focus:review-auth-and-inputs'));
  });

  it('adds security-audit focus on audit.security', async () => {
    const out = await runAppsecAgent(intent('audit.security'));
    assert.ok(out.findings.includes('focus:security-audit'));
  });
});
