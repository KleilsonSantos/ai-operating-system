import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runSafeAction, SAFE_ACTION_INTERNAL_ERROR } from './actions.ts';
import { getProvider } from '@aios/provider';
import { correlateVisibility } from '@aios/visibility';

vi.mock('@aios/provider', () => ({
  getProvider: vi.fn(),
}));

vi.mock('@aios/visibility', () => ({
  correlateVisibility: vi.fn(),
}));

const temps: string[] = [];

afterEach(() => {
  vi.clearAllMocks();
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

  it('exceção inesperada não vaza texto do Error para o cliente', async () => {
    vi.mocked(getProvider).mockReturnValue({
      health: async () => {
        throw new Error('secret stack /Users/aios/.env leaked');
      },
    } as never);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const out = await runSafeAction({
      action: 'provider_ping',
      homePath: process.cwd(),
    });
    expect(out.ok).toBe(false);
    expect(out.error).toBe(SAFE_ACTION_INTERNAL_ERROR);
    expect(out.error).not.toMatch(/secret|stack|\.env/);
    expect(JSON.stringify(out)).not.toMatch(/secret|stack|\.env/);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('rejeita action desconhecida', async () => {
    const out = await runSafeAction({
      action: 'run_agent',
      homePath: process.cwd(),
    });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/Unknown action/);
  });

  it('visibility devolve VisibilitySnapshot.trail', async () => {
    vi.mocked(correlateVisibility).mockResolvedValue({
      anchor: { workspaceId: 'aios' },
      generatedAt: '2026-08-29T00:00:00.000Z',
      knowledge: { nodeCount: 1, edgeCount: 0, kinds: {}, signals: [] },
      trail: [
        {
          kind: 'policy',
          id: 'official-docs',
          label: 'policy:official-docs',
        },
      ],
      policyRefs: ['official-docs'],
    });

    const out = await runSafeAction({
      action: 'visibility',
      homePath: process.cwd(),
      workspaceId: 'aios',
      scope: 'engines/policy',
    });
    expect(out.ok).toBe(true);
    expect(correlateVisibility).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'aios',
        scope: 'engines/policy',
        homePath: process.cwd(),
      })
    );
    const trail = (out.result as { trail: Array<{ kind: string }> }).trail;
    expect(trail).toHaveLength(1);
    expect(trail[0]?.kind).toBe('policy');
  });
});
