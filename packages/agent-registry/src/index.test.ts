import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  AgentRegistry,
  resolveDependencyTree,
  formatDependencyIssues,
  formatDependencyTreeText,
} from './index.js';

describe('AgentRegistry', () => {
  let tempDir: string;
  let registryPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aios-agent-registry-'));
    registryPath = path.join(tempDir, 'agents.registry.json');
  });

  it('should initialize with built-in agents', async () => {
    const emptyCatalog = path.join(tempDir, 'empty-community.json');
    await fs.writeFile(emptyCatalog, JSON.stringify({ agents: [] }));
    const registry = new AgentRegistry({
      registryPath,
      communityCatalogPath: emptyCatalog,
    });
    const agents = await registry.listAgents({ includeLocal: false });
    expect(agents.length).toBe(4);
    expect(agents.some((a) => a.manifest.name === '@aios/agent-architecture')).toBe(true);
  });

  it('should validate a correct manifest', () => {
    const registry = new AgentRegistry({ registryPath });
    const result = registry.validate({
      name: 'test-agent',
      version: '1.0.0',
    });
    expect(result.valid).toBe(true);
  });

  it('should validate an incorrect manifest', () => {
    const registry = new AgentRegistry({ registryPath });
    const result = registry.validate({
      name: 123,
      version: 'not a semver',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should get an agent by name', async () => {
    const registry = new AgentRegistry({ registryPath });
    const agent = await registry.getAgent('@aios/agent-qa');
    expect(agent).toBeDefined();
    expect(agent?.manifest.displayName).toBe('QA Agent');
  });

  it('should load community catalog stubs', async () => {
    const catalogPath = path.join(tempDir, 'community-catalog.json');
    await fs.writeFile(
      catalogPath,
      JSON.stringify({
        generatedAt: '2026-07-23T00:00:00.000Z',
        source: 'github-topic:aios-agent',
        agents: [
          {
            fullName: 'example/demo-agent',
            htmlUrl: 'https://github.com/example/demo-agent',
            description: 'Demo community agent',
            stargazers: 3,
            topics: ['aios-agent'],
            flags: { stale: false, suspicious: false, missingManifest: false },
            manifestPath: 'agent.yaml',
          },
        ],
      })
    );

    const registry = new AgentRegistry({ registryPath, communityCatalogPath: catalogPath });
    const agents = await registry.listAgents({ includeLocal: false });
    const community = agents.find((a) => a.source === 'community');
    expect(community).toBeDefined();
    expect(community?.manifest.name).toBe('community:example/demo-agent');
    expect(community?.manifest.metadata?.repository).toBe('https://github.com/example/demo-agent');
  });

  it('should skip community when includeCommunity is false', async () => {
    const catalogPath = path.join(tempDir, 'community-catalog.json');
    await fs.writeFile(
      catalogPath,
      JSON.stringify({
        agents: [
          {
            fullName: 'example/hidden',
            htmlUrl: 'https://github.com/example/hidden',
          },
        ],
      })
    );
    const registry = new AgentRegistry({ registryPath, communityCatalogPath: catalogPath });
    const agents = await registry.listAgents({ includeLocal: false, includeCommunity: false });
    expect(agents.every((a) => a.source !== 'community')).toBe(true);
  });

  it('resolves builtin QA → Docs dependency tree', async () => {
    const emptyCatalog = path.join(tempDir, 'empty-community.json');
    await fs.writeFile(emptyCatalog, JSON.stringify({ agents: [] }));
    const registry = new AgentRegistry({
      registryPath,
      communityCatalogPath: emptyCatalog,
    });
    const tree = await registry.resolveDependencyTreeForAgent('@aios/agent-qa', {
      listOptions: { includeLocal: false, includeCommunity: false },
    });
    expect(tree).toBeDefined();
    expect(tree?.children.some((c) => c.name === '@aios/agent-docs')).toBe(true);
    expect(formatDependencyTreeText(tree!).join('\n')).toContain('Docs Agent');
  });
});

describe('resolveDependencyTree', () => {
  const agents = [
    {
      manifest: {
        name: '@test/root',
        version: '1.0.0',
        dependencies: {
          agents: [{ name: '@test/mid' }],
        },
      },
      source: 'local' as const,
    },
    {
      manifest: {
        name: '@test/mid',
        version: '1.0.0',
        dependencies: {
          agents: [{ name: '@test/leaf' }],
        },
      },
      source: 'local' as const,
    },
    {
      manifest: {
        name: '@test/leaf',
        version: '1.0.0',
      },
      source: 'local' as const,
    },
  ];

  it('walks transitive agent dependencies', () => {
    const tree = resolveDependencyTree('@test/root', agents);
    expect(tree?.children[0]?.name).toBe('@test/mid');
    expect(tree?.children[0]?.children[0]?.name).toBe('@test/leaf');
  });

  it('flags missing dependencies', () => {
    const tree = resolveDependencyTree('@test/root', [
      {
        manifest: {
          name: '@test/root',
          version: '1.0.0',
          dependencies: { agents: [{ name: '@test/missing' }] },
        },
        source: 'local',
      },
    ]);
    expect(tree?.children[0]?.issues.some((i) => i.kind === 'missing')).toBe(true);
    expect(formatDependencyIssues(tree!).some((l) => l.includes('missing'))).toBe(true);
  });

  it('detects cycles', () => {
    const cyclic = [
      {
        manifest: {
          name: '@test/a',
          version: '1.0.0',
          dependencies: { agents: [{ name: '@test/b' }] },
        },
        source: 'local' as const,
      },
      {
        manifest: {
          name: '@test/b',
          version: '1.0.0',
          dependencies: { agents: [{ name: '@test/a' }] },
        },
        source: 'local' as const,
      },
    ];
    const tree = resolveDependencyTree('@test/a', cyclic);
    const issues = formatDependencyIssues(tree!);
    expect(issues.some((line) => line.startsWith('cycle:'))).toBe(true);
  });

  it('stops at max depth', () => {
    const deep = [
      {
        manifest: {
          name: '@test/d0',
          version: '1.0.0',
          dependencies: { agents: [{ name: '@test/d1' }] },
        },
        source: 'local' as const,
      },
      {
        manifest: {
          name: '@test/d1',
          version: '1.0.0',
          dependencies: { agents: [{ name: '@test/d2' }] },
        },
        source: 'local' as const,
      },
      {
        manifest: {
          name: '@test/d2',
          version: '1.0.0',
        },
        source: 'local' as const,
      },
    ];
    const tree = resolveDependencyTree('@test/d0', deep, { maxDepth: 1 });
    expect(formatDependencyIssues(tree!).some((l) => l.includes('max depth'))).toBe(true);
  });
});
