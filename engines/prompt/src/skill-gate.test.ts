import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  authorizeSkillTool,
  deniedSkillPayload,
  effectiveSkillIds,
  skillIdsFromArgs,
  skillIdsFromEnv,
} from './skill-gate.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function writeCatalog(
  root: string,
  skills: Array<{
    id: string;
    purpose: string;
    allowedTools: string[];
    failurePolicy: 'fail' | 'skip' | 'retry';
  }>
): void {
  mkdirSync(join(root, 'skills'));
  writeFileSync(join(root, 'skills', 'aios.skills.json'), JSON.stringify({ skills }));
}

describe('authorizeSkillTool', () => {
  it('allows any tool when skillIds omitted (default-none)', () => {
    const d = authorizeSkillTool('aios_run_pipeline', undefined);
    expect(d.allowed).toBe(true);
    expect(d.skillIds).toEqual([]);
  });

  it('denies when no requested packs resolve', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-sgate-'));
    temps.push(root);
    writeCatalog(root, []);
    const d = authorizeSkillTool('aios_compile_prompt', ['missing'], { cwd: root });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('skill.none-resolved');
    expect(deniedSkillPayload(d).error).toBe('skill.denied');
  });

  it('allows tool in the union of selected packs', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-sgate-'));
    temps.push(root);
    writeCatalog(root, [
      {
        id: 'brief-only',
        purpose: 'compile only',
        allowedTools: ['aios_compile_prompt'],
        failurePolicy: 'skip',
      },
      {
        id: 'pipeline-ok',
        purpose: 'pipeline',
        allowedTools: ['aios_run_pipeline'],
        failurePolicy: 'skip',
      },
    ]);
    const d = authorizeSkillTool('aios_run_pipeline', ['brief-only', 'pipeline-ok'], {
      cwd: root,
    });
    expect(d.allowed).toBe(true);
    expect(d.allowedTools.sort()).toEqual(['aios_compile_prompt', 'aios_run_pipeline']);
  });

  it('denies tool outside the union', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-sgate-'));
    temps.push(root);
    writeCatalog(root, [
      {
        id: 'brief-only',
        purpose: 'compile only',
        allowedTools: ['aios_compile_prompt'],
        failurePolicy: 'skip',
      },
    ]);
    const d = authorizeSkillTool('aios_run_pipeline', ['brief-only'], { cwd: root });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('skill.tool-denied');
    expect(d.allowedTools).toEqual(['aios_compile_prompt']);
  });
});

describe('skillIdsFromArgs', () => {
  it('reads string arrays only', () => {
    expect(skillIdsFromArgs({ skillIds: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(skillIdsFromArgs({ skillIds: [1, 'x'] })).toEqual(['x']);
    expect(skillIdsFromArgs({})).toBeUndefined();
    expect(skillIdsFromArgs(null)).toBeUndefined();
  });
});

describe('skillIdsFromEnv / effectiveSkillIds', () => {
  it('parses AIOS_MCP_SKILL_IDS', () => {
    expect(skillIdsFromEnv({ AIOS_MCP_SKILL_IDS: ' multi-cloud-honesty , brief ' })).toEqual([
      'multi-cloud-honesty',
      'brief',
    ]);
    expect(skillIdsFromEnv({ AIOS_MCP_SKILL_IDS: '' })).toEqual([]);
    expect(skillIdsFromEnv({})).toEqual([]);
  });

  it('unions env and args', () => {
    expect(effectiveSkillIds({ skillIds: ['b'] }, { AIOS_MCP_SKILL_IDS: 'a,b' })).toEqual([
      'a',
      'b',
    ]);
    expect(effectiveSkillIds({}, { AIOS_MCP_SKILL_IDS: 'a' })).toEqual(['a']);
    expect(effectiveSkillIds({ skillIds: ['x'] }, {})).toEqual(['x']);
    expect(effectiveSkillIds({}, {})).toBeUndefined();
  });

  it('session env alone denies tools outside pack allowedTools', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-sgate-'));
    temps.push(root);
    writeCatalog(root, [
      {
        id: 'brief-only',
        purpose: 'compile only',
        allowedTools: ['aios_compile_prompt'],
        failurePolicy: 'skip',
      },
    ]);
    const ids = effectiveSkillIds({}, { AIOS_MCP_SKILL_IDS: 'brief-only' });
    const d = authorizeSkillTool('aios_list_workspaces', ids, { cwd: root });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('skill.tool-denied');
  });
});
