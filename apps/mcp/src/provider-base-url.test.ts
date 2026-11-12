import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deniedBaseUrlResult, resolveMcpBaseUrl } from './provider-base-url.ts';

describe('resolveMcpBaseUrl', () => {
  it('uses the provider default when no override is given', () => {
    assert.deepEqual(resolveMcpBaseUrl('openai', undefined, 'https://api.openai.com/v1', {}), {
      ok: true,
    });
    assert.deepEqual(resolveMcpBaseUrl('openai', '   ', 'https://api.openai.com/v1', {}), {
      ok: true,
    });
  });

  it('accepts an override on the provider default origin', () => {
    const d = resolveMcpBaseUrl(
      'openai',
      'https://api.openai.com/v1/',
      'https://api.openai.com/v1',
      {}
    );
    assert.deepEqual(d, { ok: true, baseUrl: 'https://api.openai.com/v1/' });
  });

  it('compares against the operator-configured base URL, not a built-in default', () => {
    const gateway = 'https://gateway.example.test/v1';
    assert.equal(
      resolveMcpBaseUrl('openai', 'https://gateway.example.test/x', gateway, {}).ok,
      true
    );
    assert.equal(resolveMcpBaseUrl('openai', 'https://api.openai.com/v1', gateway, {}).ok, false);
  });

  it('denies a foreign origin so provider keys are not sent there', () => {
    const d = resolveMcpBaseUrl(
      'openai',
      'https://attacker.example.test/v1',
      'https://api.openai.com/v1',
      {}
    );
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.reason, 'base-url-not-allowed');
  });

  it('does not treat a lookalike host or different port as the same origin', () => {
    assert.equal(
      resolveMcpBaseUrl(
        'anthropic',
        'https://api.anthropic.com.evil.test',
        'https://api.anthropic.com',
        {}
      ).ok,
      false
    );
    assert.equal(
      resolveMcpBaseUrl('ollama', 'http://127.0.0.1:9999', 'http://127.0.0.1:11434', {}).ok,
      false
    );
    assert.equal(
      resolveMcpBaseUrl('ollama', 'http://127.0.0.1:11434', 'http://127.0.0.1:11434', {}).ok,
      true
    );
  });

  it('accepts an origin listed in AIOS_MCP_ALLOWED_BASE_URLS', () => {
    const env = { AIOS_MCP_ALLOWED_BASE_URLS: 'https://proxy.example.test, http://10.0.0.5:8080' };
    assert.equal(
      resolveMcpBaseUrl('openai', 'https://proxy.example.test/v1', 'https://api.openai.com/v1', env)
        .ok,
      true
    );
    assert.equal(
      resolveMcpBaseUrl('openai', 'http://10.0.0.5:8080/v1', 'https://api.openai.com/v1', env).ok,
      true
    );
    assert.equal(
      resolveMcpBaseUrl('openai', 'https://other.example.test', 'https://api.openai.com/v1', env)
        .ok,
      false
    );
  });

  it('rejects invalid URLs and non-HTTP schemes', () => {
    for (const bad of ['not a url', 'file:///etc/passwd', 'javascript:alert(1)', 'ftp://x.test']) {
      const d = resolveMcpBaseUrl('openai', bad, 'https://api.openai.com/v1', {});
      assert.equal(d.ok, false, bad);
      if (!d.ok) assert.equal(d.reason, 'base-url-invalid');
    }
  });

  it('denies unknown providers unless the origin is allowlisted', () => {
    assert.equal(resolveMcpBaseUrl('nope', 'https://x.test', undefined, {}).ok, false);
  });

  it('builds an isError payload without echoing the requested URL', () => {
    const d = resolveMcpBaseUrl(
      'openai',
      'https://attacker.example.test',
      'https://api.openai.com/v1',
      {}
    );
    assert.equal(d.ok, false);
    if (d.ok) return;
    const out = deniedBaseUrlResult(d);
    assert.equal(out.isError, true);
    const payload = JSON.parse(out.content[0]!.text) as { error: string; reason: string };
    assert.equal(payload.error, 'provider.base_url_denied');
    assert.equal(payload.reason, 'base-url-not-allowed');
    assert.ok(!out.content[0]!.text.includes('attacker'));
  });
});
