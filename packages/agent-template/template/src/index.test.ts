import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './index.ts';

describe('{{DISPLAY_NAME}} agent', () => {
  it('returns a summary for a valid intent', async () => {
    const out = await run({ intent: 'Analyze repository structure' });
    assert.equal(out.result.intent, 'Analyze repository structure');
    assert.match(out.result.summary, /processed intent/);
  });

  it('rejects empty intent', async () => {
    await assert.rejects(() => run({ intent: '  ' }), /intent is required/);
  });
});
