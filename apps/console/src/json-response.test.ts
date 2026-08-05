import { describe, expect, it } from 'vitest';
import { sanitizeForClientJson, stringifyClientJson } from './json-response.ts';

describe('sanitizeForClientJson', () => {
  it('strips Error down to name/message (no stack)', () => {
    const err = new Error('boom');
    const out = sanitizeForClientJson(err) as { name: string; message: string; stack?: string };
    expect(out).toEqual({ name: 'Error', message: 'boom' });
    expect(out.stack).toBeUndefined();
  });

  it('drops nested stack string fields', () => {
    const out = sanitizeForClientJson({
      ok: false,
      stack: 'Error: secret\n    at foo',
      nested: { stack: 'nope', msg: 'ok' },
    });
    expect(out).toEqual({ ok: false, nested: { msg: 'ok' } });
  });

  it('stringifyClientJson never includes stack text', () => {
    const text = stringifyClientJson({ error: new Error('x'), stack: 'leak' });
    expect(text).not.toMatch(/leak|at /);
    expect(text).toContain('"message": "x"');
  });
});
