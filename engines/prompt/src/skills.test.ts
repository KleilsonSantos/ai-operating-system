import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSkills, parseSkillCatalog, selectSkills } from './skills.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

const sample = {
  id: 'governed-brief',
  purpose: 'Keep the IDE agent on the compiled brief',
  allowedTools: ['aios_compile_prompt', 'aios_run_pipeline'],
  failurePolicy: 'skip',
};

describe('parseSkillCatalog', () => {
  it('accepts { skills: [...] }', () => {
    const list = parseSkillCatalog(JSON.stringify({ skills: [sample] }));
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('governed-brief');
  });

  it('rejects a vendor-like missing purpose', () => {
    expect(() =>
      parseSkillCatalog(JSON.stringify([{ id: 'x', allowedTools: [], failurePolicy: 'fail' }]))
    ).toThrow(/purpose required/);
  });
});

describe('selectSkills', () => {
  it('defaults to none', () => {
    expect(selectSkills([sample], undefined)).toEqual({ selected: [], skippedIds: [] });
    expect(selectSkills([sample], [])).toEqual({ selected: [], skippedIds: [] });
  });

  it('skips unknown ids', () => {
    const out = selectSkills([sample], ['governed-brief', 'nope']);
    expect(out.selected.map((s) => s.id)).toEqual(['governed-brief']);
    expect(out.skippedIds).toEqual(['nope']);
  });
});

describe('loadSkills', () => {
  it('does not read disk when no ids are requested', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-skill-'));
    temps.push(root);
    mkdirSync(join(root, 'skills'));
    writeFileSync(join(root, 'skills', 'aios.skills.json'), 'not-json');
    const out = loadSkills(undefined, { cwd: root });
    expect(out.skills).toEqual([]);
  });

  it('loads requested ids from the catalog file', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-skill-'));
    temps.push(root);
    mkdirSync(join(root, 'skills'));
    writeFileSync(join(root, 'skills', 'aios.skills.json'), JSON.stringify({ skills: [sample] }));
    const out = loadSkills(['governed-brief'], { cwd: root });
    expect(out.skills).toHaveLength(1);
    expect(out.path).toContain('aios.skills.json');
  });
});
