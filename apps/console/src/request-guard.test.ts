import { describe, expect, it } from 'vitest';
import { checkConsoleRequest } from './request-guard.ts';

describe('checkConsoleRequest', () => {
  it('accepts loopback hosts on any port without Origin (curl, Postman, scrape)', () => {
    for (const host of ['127.0.0.1:8787', 'localhost:8787', '[::1]:8787', 'localhost:5173']) {
      expect(checkConsoleRequest({ host }, {})).toEqual({ ok: true });
    }
  });

  it('rejects foreign Host values (DNS rebinding)', () => {
    for (const host of [
      'attacker.example.test',
      'attacker.example.test:8787',
      '127.0.0.1.evil.test',
    ]) {
      expect(checkConsoleRequest({ host }, {})).toEqual({ ok: false, reason: 'host' });
    }
  });

  it('rejects a missing or malformed Host', () => {
    expect(checkConsoleRequest({}, {})).toEqual({ ok: false, reason: 'host' });
    expect(checkConsoleRequest({ host: 'bad host' }, {})).toEqual({ ok: false, reason: 'host' });
  });

  it('accepts the Vite UI origin proxied to the API', () => {
    expect(
      checkConsoleRequest({ host: 'localhost:5173', origin: 'http://localhost:5173' }, {})
    ).toEqual({ ok: true });
    expect(
      checkConsoleRequest({ host: '127.0.0.1:8787', origin: 'http://127.0.0.1:5173' }, {})
    ).toEqual({ ok: true });
  });

  it('rejects cross-site and opaque Origin values', () => {
    for (const origin of ['https://attacker.example.test', 'http://localhost:3000', 'null']) {
      expect(checkConsoleRequest({ host: '127.0.0.1:8787', origin }, {})).toEqual({
        ok: false,
        reason: 'origin',
      });
    }
  });

  it('accepts an extra origin from AIOS_CONSOLE_ALLOWED_ORIGINS', () => {
    const env = { AIOS_CONSOLE_ALLOWED_ORIGINS: 'http://localhost:3000, https://ops.example.test' };
    expect(
      checkConsoleRequest({ host: 'localhost:8787', origin: 'http://localhost:3000' }, env)
    ).toEqual({
      ok: true,
    });
    expect(
      checkConsoleRequest({ host: 'localhost:8787', origin: 'https://other.example.test' }, env)
    ).toEqual({ ok: false, reason: 'origin' });
  });

  it('uses the first value when a header arrives as an array', () => {
    expect(checkConsoleRequest({ host: ['localhost:8787', 'attacker.test'] }, {})).toEqual({
      ok: true,
    });
  });
});
