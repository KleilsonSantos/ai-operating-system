import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { PLATFORM_CORE_MUST_IDS, auditGovernance, listDecisions, recordDecision } from './index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function writeMinimalDocs(root: string) {
  writeFileSync(join(root, 'README.md'), '#');
  writeFileSync(join(root, 'CHANGELOG.md'), '#');
  writeFileSync(join(root, 'AGENTS.md'), '#');
  mkdirSync(join(root, 'docs', 'architecture'), { recursive: true });
  mkdirSync(join(root, 'docs', 'adr'), { recursive: true });
  writeFileSync(join(root, 'docs', 'FOUNDATION.md'), '#');
  writeFileSync(join(root, 'docs', 'VISION.md'), '#');
  writeFileSync(join(root, 'docs', 'ROADMAP.md'), '#');
  writeFileSync(join(root, 'docs', 'architecture', 'overview.md'), '#');
  writeFileSync(join(root, 'docs', 'architecture', 'system-guide.md'), '#');
  for (const a of [
    '0001-standalone-platform.md',
    '0002-git-branching-strategy.md',
    '0003-pipeline-integration-contract.md',
  ]) {
    writeFileSync(join(root, 'docs', 'adr', a), '#');
  }
  mkdirSync(join(root, 'engines', 'documentation'), { recursive: true });
  mkdirSync(join(root, 'engines', 'governance'), { recursive: true });
}

describe('governance', () => {
  it('record + list decisions (normalizes kind)', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-gov-'));
    temps.push(root);
    const entry = recordDecision(
      { kind: 'Policy', summary: 'accepted resource-first', verdict: 'pass' },
      { homePath: root }
    );
    expect(entry.id).toBeTruthy();
    expect(entry.kind).toBe('policy');
    const listed = listDecisions({ homePath: root, limit: 5 });
    expect(listed.decisions).toHaveLength(1);
    expect(listed.decisions[0]?.summary).toMatch(/resource-first/);
  });

  it('auditGovernance ok on minimal fixture with core musts', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-gov-a-'));
    temps.push(root);
    writeMinimalDocs(root);
    mkdirSync(join(root, 'policies'));
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify({
        policies: PLATFORM_CORE_MUST_IDS.map((id) => ({
          id,
          description: id,
          severity: 'must',
        })),
      })
    );

    const audit = auditGovernance({
      homePath: root,
      repoPath: root,
      includeDocumentation: true,
    });
    expect(audit.policies.mustIds).toContain('resource-first');
    expect(audit.policies.missingCoreMustIds).toBeUndefined();
    expect(audit.documentation?.ok).toBe(true);
    expect(audit.ok).toBe(true);
  });

  it('flags missing core must, fail verdicts, unknown policy refs', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-gov-v2-'));
    temps.push(root);
    writeMinimalDocs(root);
    mkdirSync(join(root, 'policies'));
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify({
        policies: [
          { id: 'resource-first', description: 'r', severity: 'must' },
          { id: 'trade-offs', description: 't', severity: 'must' },
        ],
      })
    );
    recordDecision(
      {
        kind: 'exception',
        summary: 'broke the gate',
        verdict: 'fail',
        policyIds: ['no-such-policy', 'resource-first'],
      },
      { homePath: root }
    );
    recordDecision(
      { kind: 'weird-custom', summary: 'ad-hoc note', verdict: 'info' },
      { homePath: root }
    );

    const audit = auditGovernance({
      homePath: root,
      repoPath: root,
      includeDocumentation: false,
    });
    expect(audit.ok).toBe(false);
    expect(audit.policies.missingCoreMustIds?.length).toBeGreaterThan(0);
    expect(audit.findings.some((f) => f.id === 'gov-missing-core-must')).toBe(true);
    expect(audit.findings.some((f) => f.id === 'gov-fail-verdicts')).toBe(true);
    expect(audit.findings.some((f) => f.id === 'gov-unknown-policy-ref')).toBe(true);
    expect(audit.findings.some((f) => f.id === 'gov-unknown-kind')).toBe(true);
    expect(audit.decisions.failCount).toBe(1);
    expect(audit.decisions.unknownPolicyIds).toContain('no-such-policy');
  });
});
