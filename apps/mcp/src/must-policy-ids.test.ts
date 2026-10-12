import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_POLICIES } from '@aios/policy';
import { authorizeMcpTool, MCP_SAFE_WRITE_CONSENT_POLICY_ID } from '@aios/shared';
import { resolveMcpMustIds } from './must-policy-ids.ts';

describe('resolveMcpMustIds', () => {
  it('fails closed on aios_memory_clear when no policy file is loaded (defaults only)', () => {
    const mustIds = resolveMcpMustIds({ rules: [...DEFAULT_POLICIES], source: 'defaults' });
    assert.ok(mustIds.includes(MCP_SAFE_WRITE_CONSENT_POLICY_ID));
    const decision = authorizeMcpTool('aios_memory_clear', {
      env: { AIOS_MCP_PRIVILEGE: 'SAFE_WRITE' },
      mustIds,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, 'mcp-safe-write-consent');
  });

  it('allows the consent tools with AIOS_MCP_ALLOW_SAFE_WRITE=1 under the floor', () => {
    const mustIds = resolveMcpMustIds({ rules: [...DEFAULT_POLICIES], source: 'defaults' });
    const decision = authorizeMcpTool('aios_memory_clear', {
      env: { AIOS_MCP_PRIVILEGE: 'SAFE_WRITE', AIOS_MCP_ALLOW_SAFE_WRITE: '1' },
      mustIds,
    });
    assert.equal(decision.allowed, true);
  });

  it('does not duplicate the id when a policy file already declares it', () => {
    const rules = [
      ...DEFAULT_POLICIES,
      { id: MCP_SAFE_WRITE_CONSENT_POLICY_ID, description: 'x', severity: 'must' as const },
    ];
    const mustIds = resolveMcpMustIds({ rules, source: 'merged' });
    assert.equal(mustIds.filter((id) => id === MCP_SAFE_WRITE_CONSENT_POLICY_ID).length, 1);
  });

  it('respects a policy file that deliberately omits the rule', () => {
    const mustIds = resolveMcpMustIds({ rules: [...DEFAULT_POLICIES], source: 'merged' });
    assert.equal(mustIds.includes(MCP_SAFE_WRITE_CONSENT_POLICY_ID), false);
  });
});
