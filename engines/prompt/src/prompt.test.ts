import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { compilePrompt } from './index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('compilePrompt', () => {
  it('monta brief com policies e intent', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-prompt-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"p"}');
    writeFileSync(join(root, 'README.md'), '# P\n');
    mkdirSync(join(root, 'policies'));
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify({
        policies: [
          {
            id: 'official-docs',
            description: 'docs oficiais',
            severity: 'must',
          },
          {
            id: 'git-flow-sandbox',
            description: 'git flow',
            severity: 'must',
          },
        ],
      })
    );
    const out = compilePrompt({
      input: 'Analise meu projeto.',
      repoPath: root,
    });
    expect(out.intent.kind).toBe('analyze.project');
    expect(out.brief).toContain('AIOS brief');
    expect(out.brief).toContain('official-docs');
    expect(out.stats.mustPolicyCount).toBeGreaterThan(0);
    expect(out.stats.briefChars).toBeGreaterThan(100);
    expect(out.skills).toEqual([]);
    expect(out.stats.skillCount).toBe(0);
    expect(out.brief).not.toContain('## Skills');
  });

  it('injeta skill pack no brief quando pedido', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-prompt-skill-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"p"}');
    mkdirSync(join(root, 'skills'));
    writeFileSync(
      join(root, 'skills', 'aios.skills.json'),
      JSON.stringify({
        skills: [
          {
            id: 'governed-brief',
            purpose: 'Stay on the brief',
            allowedTools: ['aios_compile_prompt'],
            failurePolicy: 'skip',
          },
        ],
      })
    );
    const out = compilePrompt({
      input: 'Analise meu projeto.',
      repoPath: root,
      skillIds: ['governed-brief'],
    });
    expect(out.stats.skillCount).toBe(1);
    expect(out.brief).toContain('## Skills');
    expect(out.brief).toContain('governed-brief');
  });
});
