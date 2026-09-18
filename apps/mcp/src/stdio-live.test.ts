/**
 * Live MCP stdio harness (audit P1).
 * Spawns the real server process and round-trips JSON-RPC via the official SDK client.
 * Does not import `./index.ts` (that module always calls main()).
 * Spawn uses `node --import tsx` (not the `tsx` CLI) so the child does not open a
 * tsx IPC unix socket — that listen fails with EPERM under Cursor Agent sandbox
 * and breaks pre-commit `pnpm test`.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(mcpRoot, '../..');
const serverEntry = path.join(mcpRoot, 'src/index.ts');

/** Prefer `--import tsx` over `tsx/cli` to avoid createIpcServer (EPERM in sandboxes). */
function mcpStdioTransport(env: Record<string, string>): StdioClientTransport {
  return new StdioClientTransport({
    command: process.execPath,
    args: ['--import', 'tsx', serverEntry],
    cwd: mcpRoot,
    stderr: 'pipe',
    env,
  });
}

function textPayload(result: unknown): string {
  const content = (result as { content?: Array<{ type: string; text?: string }> }).content;
  const block = content?.find((c) => c.type === 'text' && typeof c.text === 'string');
  assert.ok(block?.text, 'expected text content from MCP tool');
  return block.text;
}

describe('MCP stdio live harness', () => {
  let client: Client;

  before(async () => {
    const transport = mcpStdioTransport({
      AIOS_HOME: repoRoot,
      AIOS_MCP_QUIET: '1',
      // Force default privilege surface (parent shell may export overrides).
      AIOS_MCP_ALLOW_PRIVILEGED: '',
      AIOS_MCP_ALLOW_SAFE_WRITE: '',
      AIOS_MCP_PRIVILEGE: '',
    });
    const stderrChunks: Buffer[] = [];
    transport.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });
    client = new Client({ name: 'aios-mcp-stdio-harness', version: '0.0.0' });
    try {
      await client.connect(transport);
    } catch (err) {
      const stderr = Buffer.concat(stderrChunks).toString('utf8');
      throw new Error(
        `MCP stdio connect failed: ${err instanceof Error ? err.message : String(err)}\nstderr:\n${stderr}`,
        { cause: err }
      );
    }
  });

  after(async () => {
    await client?.close();
  });

  it('lists tools over a real stdio session', async () => {
    const listed = await client.listTools();
    const names = new Set(listed.tools.map((t) => t.name));
    assert.ok(names.has('aios_list_agents'));
    assert.ok(names.has('aios_workspace_remove'));
    assert.ok(names.has('aios_compile_prompt'));
  });

  it('round-trips aios_list_agents', async () => {
    const result = await client.callTool({ name: 'aios_list_agents', arguments: {} });
    assert.notEqual(result.isError, true);
    const body = JSON.parse(textPayload(result)) as { count?: number; agents?: unknown[] };
    assert.equal(typeof body.count, 'number');
    assert.ok(Array.isArray(body.agents));
  });

  it('denies aios_workspace_remove with policy.denied on the live path', async () => {
    const result = await client.callTool({
      name: 'aios_workspace_remove',
      arguments: { id: 'harness-deny' },
    });
    assert.equal(result.isError, true);
    const body = JSON.parse(textPayload(result)) as {
      error: string;
      reason?: string;
      tool?: string;
    };
    assert.equal(body.error, 'policy.denied');
    assert.equal(body.tool, 'aios_workspace_remove');
    assert.equal(body.reason, 'insufficient-privilege');
  });

  it('round-trips aios_compile_prompt', async () => {
    const result = await client.callTool({
      name: 'aios_compile_prompt',
      arguments: { input: 'health endpoint' },
    });
    assert.notEqual(result.isError, true);
    const body = JSON.parse(textPayload(result)) as {
      brief?: unknown;
      stats?: unknown;
    };
    assert.ok(body.brief !== undefined);
    assert.ok(body.stats !== undefined);
  });

  it('denies aios_compile_prompt with skill.denied when skillIds resolve to none (#482)', async () => {
    const result = await client.callTool({
      name: 'aios_compile_prompt',
      arguments: { input: 'health endpoint', skillIds: ['no-such-skill-pack'] },
    });
    assert.equal(result.isError, true);
    const body = JSON.parse(textPayload(result)) as {
      error?: string;
      reason?: string;
      tool?: string;
    };
    assert.equal(body.error, 'skill.denied');
    assert.equal(body.tool, 'aios_compile_prompt');
    assert.equal(body.reason, 'skill.none-resolved');
  });
});

describe('MCP stdio session skill env (#483)', () => {
  let sessionClient: Client;

  before(async () => {
    const transport = mcpStdioTransport({
      AIOS_HOME: repoRoot,
      AIOS_MCP_QUIET: '1',
      AIOS_MCP_ALLOW_PRIVILEGED: '',
      AIOS_MCP_ALLOW_SAFE_WRITE: '',
      AIOS_MCP_PRIVILEGE: '',
      // In-repo pack allows compile/pipeline/workspaces — not list_agents
      AIOS_MCP_SKILL_IDS: 'multi-cloud-honesty',
    });
    sessionClient = new Client({ name: 'aios-mcp-session-skills', version: '0.0.0' });
    await sessionClient.connect(transport);
  });

  after(async () => {
    await sessionClient?.close();
  });

  it('denies tools outside session pack allowedTools', async () => {
    const result = await sessionClient.callTool({ name: 'aios_list_agents', arguments: {} });
    assert.equal(result.isError, true);
    const body = JSON.parse(textPayload(result)) as {
      error?: string;
      reason?: string;
      tool?: string;
    };
    assert.equal(body.error, 'skill.denied');
    assert.equal(body.tool, 'aios_list_agents');
    assert.equal(body.reason, 'skill.tool-denied');
  });

  it('allows aios_compile_prompt under multi-cloud-honesty session', async () => {
    const result = await sessionClient.callTool({
      name: 'aios_compile_prompt',
      arguments: { input: 'health endpoint' },
    });
    assert.notEqual(result.isError, true);
  });
});
