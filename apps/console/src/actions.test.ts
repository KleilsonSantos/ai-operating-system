import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { runSafeAction } from './actions.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('runSafeAction', () => {
  it('contract devolve contractVersion', async () => {
    const out = await runSafeAction({
      action: 'contract',
      homePath: process.cwd(),
    });
    expect(out.ok).toBe(true);
    expect(out.result).toEqual({ contractVersion: '1' });
  });

  it('validate_workspaces e load_policies no fixture', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-act-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"t"}');
    mkdirSync(join(root, 'workspaces'));
    writeFileSync(
      join(root, 'workspaces', 'aios.workspaces.json'),
      JSON.stringify({
        workspaces: [{ id: 'aios', path: '.', default: true }],
      })
    );
    mkdirSync(join(root, 'policies'));
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify({
        policies: [{ id: 'official-docs', description: 'd', severity: 'must' }],
      })
    );

    const v = await runSafeAction({
      action: 'validate_workspaces',
      homePath: root,
    });
    expect(v.ok).toBe(true);
    expect((v.result as { count: number }).count).toBe(1);

    const p = await runSafeAction({
      action: 'load_policies',
      homePath: root,
    });
    expect(p.ok).toBe(true);
    expect((p.result as { mustIds: string[] }).mustIds).toContain('official-docs');
  });

  it('rejeita action desconhecida', async () => {
    const out = await runSafeAction({
      action: 'run_agent',
      homePath: process.cwd(),
    });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/Unknown action/);
  });
});
