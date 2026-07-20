import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getOperationalState,
  probeGit,
  recordOperationalEvent,
  hasOperationalEvents,
} from './index.ts';
import { recordDecision } from '@aios/governance';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function initGit(dir: string, branch = 'feature/os-test'): void {
  execFileSync('git', ['init', '-b', branch], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@aios.local'], {
    cwd: dir,
    stdio: 'ignore',
  });
  execFileSync('git', ['config', 'user.name', 'AIOS Test'], {
    cwd: dir,
    stdio: 'ignore',
  });
  writeFileSync(join(dir, 'README.md'), '# t');
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'init'], { cwd: dir, stdio: 'ignore' });
}

describe('operational-state', () => {
  it('probeGit lê branch em work tree', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-os-git-'));
    temps.push(root);
    initGit(root, 'feature/os-test');
    const git = probeGit(root);
    expect(git.available).toBe(true);
    expect(git.branch).toBe('feature/os-test');
    expect(git.head).toBeTruthy();
  });

  it('getOperationalState agrega health + governance + boundaries', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-os-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"aios"}');
    mkdirSync(join(root, 'policies'), { recursive: true });
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify({
        policies: [{ id: 'must-test', severity: 'must', description: 't' }],
      })
    );
    mkdirSync(join(root, 'workspaces'), { recursive: true });
    writeFileSync(
      join(root, 'workspaces', 'aios.workspaces.json'),
      JSON.stringify({
        workspaces: [{ id: 'demo', name: 'Demo', path: '.', default: true }],
      })
    );
    initGit(root);
    recordDecision({ kind: 'note', summary: 'os mvp', verdict: 'info' }, { homePath: root });

    const state = await getOperationalState({
      homePath: root,
      providerHealth: {
        provider: 'ollama',
        ok: false,
        baseUrl: 'http://127.0.0.1:11434',
        error: 'skipped',
      },
    });

    expect(state.mode).toBe('on-demand');
    expect(state.boundaries.voice).toBe(false);
    expect(state.boundaries.ideControl).toBe(false);
    expect(state.governance.decisionCount).toBe(1);
    expect(state.focus?.workspaceId).toBe('demo');
    expect(state.git.available).toBe(true);
    expect(state.summary).toMatch(/workspace/);
    expect(state.health.attention.length).toBeGreaterThan(0);
  });

  it('recordOperationalEvent append JSONL on-demand', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-os-ev-'));
    temps.push(root);
    expect(hasOperationalEvents(root)).toBe(false);
    const path = recordOperationalEvent({ kind: 'snapshot', note: 'test' }, { homePath: root });
    expect(path).toMatch(/events\.jsonl$/);
    expect(hasOperationalEvents(root)).toBe(true);
  });
});
