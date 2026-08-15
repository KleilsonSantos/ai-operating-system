import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { denyMcpTool, isMcpToolAllowed } from './capability-gate.ts';

describe('MCP capability gate', () => {
  it('allows read tools at default privilege', () => {
    assert.equal(isMcpToolAllowed('aios_contract_version', {}), true);
  });

  it('denies privileged tools and returns policy.denied', () => {
    assert.equal(isMcpToolAllowed('aios_workspace_remove', {}), false);
    const denied = denyMcpTool('aios_workspace_remove', {});
    assert.equal(denied.isError, true);
    const payload = JSON.parse(denied.content[0]!.text) as { error: string };
    assert.equal(payload.error, 'policy.denied');
  });
});
