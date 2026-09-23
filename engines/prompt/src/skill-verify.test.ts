import { describe, expect, it } from 'vitest';
import {
  collectCheckTokens,
  parseCheckToken,
  resolveSkillDecisions,
  verifySkillPack,
} from './skill-verify.ts';
import type { SkillManifest } from '@aios/shared';

const base: SkillManifest = {
  id: 'demo',
  purpose: 'test pack',
  allowedTools: ['aios_compile_prompt'],
  failurePolicy: 'skip',
};

describe('parseCheckToken / collectCheckTokens (#520)', () => {
  it('extracts check: tokens and ignores free text', () => {
    expect(parseCheckToken('check:workspaceId')).toBe('workspaceId');
    expect(parseCheckToken('workspaceId cloud-event-lab')).toBeUndefined();
    expect(
      collectCheckTokens({
        ...base,
        prerequisites: ['check:workspaceId', 'human note', 'check:workspaceId'],
        validation: ['check:context', 'No Floci claim'],
      })
    ).toEqual(['workspaceId', 'context']);
  });
});

describe('verifySkillPack (#520)', () => {
  it('passes when no machine checks', () => {
    const out = verifySkillPack(base, { skillIds: ['demo'] });
    expect(out.outcome).toBe('passed');
    expect(out.reason).toMatch(/no check:/);
  });

  it('passes when check:workspaceId and workspace present', () => {
    const out = verifySkillPack(
      { ...base, prerequisites: ['check:workspaceId'] },
      { skillIds: ['demo'], workspaceId: 'lab' }
    );
    expect(out.outcome).toBe('passed');
    expect(out.failedChecks).toEqual([]);
  });

  it('skips on failed check when failurePolicy=skip', () => {
    const out = verifySkillPack(
      { ...base, prerequisites: ['check:workspaceId'], failurePolicy: 'skip' },
      { skillIds: ['demo'] }
    );
    expect(out.outcome).toBe('skipped');
    expect(out.failedChecks).toEqual(['workspaceId']);
  });

  it('fails hard when failurePolicy=fail', () => {
    const out = verifySkillPack(
      { ...base, prerequisites: ['check:repoPath'], failurePolicy: 'fail' },
      { skillIds: ['demo'] }
    );
    expect(out.outcome).toBe('failed');
    expect(out.reason).toMatch(/failurePolicy=fail/);
  });

  it('fails closed on unknown check token', () => {
    const out = verifySkillPack(
      { ...base, validation: ['check:made-up'], failurePolicy: 'fail' },
      { skillIds: ['demo'], workspaceId: 'x' }
    );
    expect(out.outcome).toBe('failed');
    expect(out.failedChecks).toEqual(['unknown:made-up']);
  });
});

describe('resolveSkillDecisions (#520)', () => {
  it('records unknown ids as skipped', () => {
    const out = resolveSkillDecisions(['nope'], [base], {});
    expect(out).toEqual([
      {
        id: 'nope',
        outcome: 'skipped',
        reason: 'unknown skill id (not in catalog)',
        hardFail: false,
      },
    ]);
  });

  it('verifies catalog hits', () => {
    const pack: SkillManifest = {
      ...base,
      prerequisites: ['check:workspaceId'],
      failurePolicy: 'skip',
    };
    const out = resolveSkillDecisions(['demo'], [pack], { workspaceId: 'ws' });
    expect(out[0]?.outcome).toBe('passed');
    expect(out[0]?.hardFail).toBe(false);
  });
});
