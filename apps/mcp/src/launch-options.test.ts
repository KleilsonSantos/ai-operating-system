import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_MCP_HTTP_PORT, parseMcpLaunchOptions } from './launch-options.ts';

describe('parseMcpLaunchOptions', () => {
  it('defaults to stdio when unset', () => {
    const opts = parseMcpLaunchOptions([], {});
    assert.equal(opts.http, false);
    assert.equal(opts.port, DEFAULT_MCP_HTTP_PORT);
    assert.equal(opts.host, '127.0.0.1');
  });

  it('enables HTTP via env or --http', () => {
    assert.equal(parseMcpLaunchOptions([], { AIOS_MCP_HTTP: '1' }).http, true);
    assert.equal(parseMcpLaunchOptions(['--http'], {}).http, true);
  });

  it('reads port from env and argv', () => {
    assert.equal(parseMcpLaunchOptions([], { AIOS_MCP_PORT: '9001' }).port, 9001);
    assert.equal(parseMcpLaunchOptions(['--port', '9002'], {}).port, 9002);
    assert.equal(parseMcpLaunchOptions(['--port=9003'], {}).port, 9003);
  });

  it('rejects invalid ports', () => {
    assert.throws(() => parseMcpLaunchOptions([], { AIOS_MCP_PORT: '0' }));
    assert.throws(() => parseMcpLaunchOptions(['--port'], {}));
  });
});
