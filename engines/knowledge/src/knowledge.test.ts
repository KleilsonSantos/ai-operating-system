import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildKnowledgeGraph,
  parsePnpmWorkspacePackageGlobs,
  summarizeKnowledge,
} from './index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function fixtureRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-kg-'));
  temps.push(root);
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'kg-fixture', private: true }));
  writeFileSync(join(root, 'README.md'), '# Fixture\n');
  mkdirSync(join(root, 'docs', 'adr'), { recursive: true });
  writeFileSync(join(root, 'docs', 'FOUNDATION.md'), '# F\n');
  writeFileSync(join(root, 'docs', 'adr', '0005-knowledge-graph-heuristic.md'), '# ADR\n');
  mkdirSync(join(root, 'engines', 'policy'), { recursive: true });
  mkdirSync(join(root, 'packages', 'shared'), { recursive: true });
  mkdirSync(join(root, 'tools', 'cli-helper'), { recursive: true });
  mkdirSync(join(root, 'policies'), { recursive: true });
  writeFileSync(
    join(root, 'packages', 'shared', 'package.json'),
    JSON.stringify({
      name: '@aios/shared',
      private: true,
      dependencies: { '@aios/policy': 'workspace:*' },
    })
  );
  writeFileSync(
    join(root, 'engines', 'policy', 'package.json'),
    JSON.stringify({
      name: '@aios/policy',
      private: true,
      dependencies: { '@aios/shared': 'workspace:*' },
    })
  );
  writeFileSync(
    join(root, 'tools', 'cli-helper', 'package.json'),
    JSON.stringify({ name: '@aios/cli-helper', private: true })
  );
  writeFileSync(
    join(root, 'pnpm-workspace.yaml'),
    "packages:\n  - 'packages/*'\n  - 'engines/*'\n  - 'tools/*'\n"
  );
  writeFileSync(join(root, 'policies', 'aios.policies.json'), '{}\n');
  writeFileSync(join(root, 'policies', 'resource-aware-macos.json'), '{}\n');
  return root;
}

describe('parsePnpmWorkspacePackageGlobs', () => {
  it('reads quoted globs under packages: and stops at the next key', () => {
    const globs = parsePnpmWorkspacePackageGlobs(
      "packages:\n  - 'apps/*'\n  - 'tools/*'\nallowBuilds:\n  esbuild: true\n"
    );
    expect(globs).toEqual(['apps/*', 'tools/*']);
  });
});

describe('buildKnowledgeGraph', () => {
  it('monta projeto + docs + engines/packages', () => {
    const repo = fixtureRepo();
    const g = buildKnowledgeGraph({ repoPath: repo });
    expect(g.nodes.some((n) => n.kind === 'project')).toBe(true);
    expect(g.nodes.some((n) => n.kind === 'doc')).toBe(true);
    expect(g.nodes.some((n) => n.kind === 'engine')).toBe(true);
    expect(g.edges.some((e) => e.kind === 'contains')).toBe(true);
    expect(g.edges.some((e) => e.kind === 'depends_on')).toBe(true);
    const sum = summarizeKnowledge(g);
    expect(sum.nodeCount).toBeGreaterThan(3);
    expect(sum.edgeCount).toBeGreaterThan(2);
  });

  it('adds workspace depends_on in both directions after a two-pass scan', () => {
    const repo = fixtureRepo();
    const g = buildKnowledgeGraph({ repoPath: repo });
    const policy = g.nodes.find((n) => n.label === '@aios/policy');
    const shared = g.nodes.find((n) => n.label === '@aios/shared');
    expect(policy).toBeDefined();
    expect(shared).toBeDefined();
    expect(
      g.edges.some((e) => e.kind === 'depends_on' && e.from === policy?.id && e.to === shared?.id)
    ).toBe(true);
    expect(
      g.edges.some((e) => e.kind === 'depends_on' && e.from === shared?.id && e.to === policy?.id)
    ).toBe(true);
  });

  it('maps extra pnpm-workspace buckets, ADR files, and policy JSON', () => {
    const repo = fixtureRepo();
    const g = buildKnowledgeGraph({ repoPath: repo });
    expect(g.nodes.some((n) => n.kind === 'module' && n.label === 'tools')).toBe(true);
    expect(g.nodes.some((n) => n.label === '@aios/cli-helper')).toBe(true);
    expect(g.nodes.some((n) => n.path === 'docs/adr/0005-knowledge-graph-heuristic.md')).toBe(true);
    expect(
      g.nodes.some((n) => n.kind === 'policy' && n.path === 'policies/resource-aware-macos.json')
    ).toBe(true);
    expect(g.signals.some((s) => s.startsWith('pnpm-workspace:'))).toBe(true);
  });
});
