import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { denyMcpTool, isMcpToolAllowed } from './capability-gate.ts';
import { MCP_SAFE_WRITE_CONSENT_POLICY_ID } from '@aios/shared';

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

  it('denies aios_pkb_rebuild_vectors when mcp-safe-write-consent must is active (#327)', () => {
    const mustIds = [MCP_SAFE_WRITE_CONSENT_POLICY_ID];
    assert.equal(isMcpToolAllowed('aios_pkb_rebuild_vectors', {}, mustIds), false);
  });

  it('denies aios_memory_clear when mcp-safe-write-consent must is active (#378)', () => {
    const mustIds = [MCP_SAFE_WRITE_CONSENT_POLICY_ID];
    assert.equal(isMcpToolAllowed('aios_memory_clear', {}, mustIds), false);
    const denied = denyMcpTool('aios_memory_clear', {}, mustIds);
    const payload = JSON.parse(denied.content[0]!.text) as {
      error: string;
      reason?: string;
      policyId?: string;
    };
    assert.equal(payload.error, 'policy.denied');
    assert.equal(payload.reason, 'mcp-safe-write-consent');
    assert.equal(payload.policyId, MCP_SAFE_WRITE_CONSENT_POLICY_ID);
  });

  it('allows aios_memory_clear with AIOS_MCP_ALLOW_SAFE_WRITE=1 under consent policy', () => {
    const mustIds = [MCP_SAFE_WRITE_CONSENT_POLICY_ID];
    assert.equal(
      isMcpToolAllowed('aios_memory_clear', { AIOS_MCP_ALLOW_SAFE_WRITE: '1' }, mustIds),
      true
    );
  });
});
