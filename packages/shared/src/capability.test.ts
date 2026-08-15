import { describe, expect, it } from 'vitest';
import {
  authorizeMcpTool,
  deniedMcpPayload,
  MCP_TOOL_CATALOG,
  MCP_TOOL_PRIVILEGE,
  privilegeForMcpTool,
  resolveCallerPrivilege,
} from './index.ts';

describe('resolveCallerPrivilege', () => {
  it('defaults to CONTROLLED_EXECUTION', () => {
    expect(resolveCallerPrivilege({})).toBe('CONTROLLED_EXECUTION');
  });

  it('reads AIOS_MCP_PRIVILEGE when valid', () => {
    expect(resolveCallerPrivilege({ AIOS_MCP_PRIVILEGE: 'READ_ONLY' })).toBe('READ_ONLY');
  });

  it('ignores invalid env values', () => {
    expect(resolveCallerPrivilege({ AIOS_MCP_PRIVILEGE: 'ROOT' })).toBe('CONTROLLED_EXECUTION');
  });
});

describe('authorizeMcpTool', () => {
  it('allows read tools at default privilege', () => {
    const d = authorizeMcpTool('aios_list_workspaces', { env: {} });
    expect(d.allowed).toBe(true);
    expect(d.required).toBe('READ_ONLY');
  });

  it('allows pipeline at default privilege', () => {
    expect(authorizeMcpTool('aios_run_pipeline', { env: {} }).allowed).toBe(true);
  });

  it('denies pipeline for READ_ONLY callers', () => {
    const d = authorizeMcpTool('aios_run_pipeline', { privilege: 'READ_ONLY', env: {} });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('insufficient-privilege');
  });

  it('denies PRIVILEGED tools by default', () => {
    const d = authorizeMcpTool('aios_workspace_remove', { env: {} });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('insufficient-privilege');
  });

  it('still denies PRIVILEGED without the allow flag', () => {
    const d = authorizeMcpTool('aios_workspace_remove', {
      privilege: 'PRIVILEGED',
      env: {},
    });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('privileged-not-enabled');
  });

  it('allows PRIVILEGED only with operator flag', () => {
    const d = authorizeMcpTool('aios_workspace_remove', {
      privilege: 'PRIVILEGED',
      env: { AIOS_MCP_ALLOW_PRIVILEGED: '1' },
    });
    expect(d.allowed).toBe(true);
  });

  it('fails closed on unknown tools', () => {
    const d = authorizeMcpTool('aios_shell_exec', { env: {} });
    expect(d.allowed).toBe(false);
    expect(privilegeForMcpTool('aios_shell_exec')).toBe('PRIVILEGED');
  });

  it('shapes policy.denied payload', () => {
    const d = authorizeMcpTool('aios_workspace_remove', { env: {} });
    expect(deniedMcpPayload(d)).toMatchObject({
      error: 'policy.denied',
      tool: 'aios_workspace_remove',
    });
  });

  it('covers every catalogued tool', () => {
    for (const tool of MCP_TOOL_CATALOG) {
      expect(MCP_TOOL_PRIVILEGE[tool]).toBeDefined();
    }
  });
});
