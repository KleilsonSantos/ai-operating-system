import fs from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AjvRaw from 'ajv';
import type { ValidateFunction } from 'ajv';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ajv = AjvRaw as any;

import { load as yamlLoad } from 'js-yaml';
import { execFile } from 'child_process';
import { promisify } from 'util';

import {
  resolveDependencyTree as buildDependencyTree,
  type AgentDependencyTreeNode,
} from './dependency-tree.js';

export {
  resolveDependencyTree,
  buildAgentIndex,
  formatDependencyIssues,
  formatDependencyTreeText,
  type AgentDependencyTreeNode,
  type AgentDependencyIssue,
  type ResolveDependencyTreeOptions,
} from './dependency-tree.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const agentSchema = JSON.parse(
  readFileSync(path.join(__dirname, '../schema/agent.schema.json'), 'utf-8')
);
const execFilePromise = promisify(execFile);
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface AgentManifest {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  inputs?: Record<
    string,
    { type: string; description?: string; required?: boolean; default?: unknown }
  >;
  outputs?: Record<string, { type: string; description?: string }>;
  dependencies?: { agents?: Array<{ name: string; version?: string }>; engines?: string[] };
  metadata?: Record<string, unknown>;
}

export interface AgentEntry {
  manifest: AgentManifest;
  source: 'builtin' | 'local' | 'npm' | 'git' | 'community';
  path?: string;
  healthScore?: number;
}

export interface CommunityCatalogFlags {
  stale?: boolean;
  suspicious?: boolean;
  missingManifest?: boolean;
}

export interface CommunityCatalogAgent {
  fullName: string;
  htmlUrl: string;
  description?: string;
  stargazers?: number;
  forks?: number;
  pushedAt?: string;
  createdAt?: string;
  defaultBranch?: string;
  topics?: string[];
  archived?: boolean;
  manifestPath?: string | null;
  flags?: CommunityCatalogFlags;
}

export interface CommunityCatalog {
  generatedAt?: string;
  source?: string;
  query?: string;
  agents: CommunityCatalogAgent[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_COMMUNITY_CATALOG = path.join(__dirname, '../data/community-catalog.json');

export class AgentRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly ajv: any;
  private readonly validateFn: ValidateFunction;
  private builtinAgents: AgentEntry[] = [];
  private readonly registryPath: string;
  private readonly communityCatalogPath: string;
  private readonly cache: Map<string, CacheEntry<unknown>> = new Map();

  constructor(options?: { registryPath?: string; communityCatalogPath?: string }) {
    this.ajv = new Ajv({ strict: false });
    this.validateFn = this.ajv.compile(agentSchema);
    this.registryPath =
      options?.registryPath || path.join(process.cwd(), '.aios', 'agents.registry.json');
    this.communityCatalogPath = options?.communityCatalogPath || DEFAULT_COMMUNITY_CATALOG;
    this.initBuiltinAgents();
  }

  private initBuiltinAgents(): void {
    this.builtinAgents = [
      {
        manifest: {
          name: '@aios/agent-architecture',
          version: '0.0.0',
          displayName: 'Architecture Agent',
          description: 'Analisa e sugere arquitetura para o projeto',
          dependencies: { engines: ['context', 'knowledge'] },
          metadata: { category: 'analysis', tags: ['architecture', 'design'] },
        },
        source: 'builtin',
      },
      {
        manifest: {
          name: '@aios/agent-appsec',
          version: '0.0.0',
          displayName: 'AppSec Agent',
          description: 'Audita segurança do código e infraestrutura',
          dependencies: { engines: ['context'] },
          metadata: { category: 'security', tags: ['security', 'audit'] },
        },
        source: 'builtin',
      },
      {
        manifest: {
          name: '@aios/agent-docs',
          version: '0.0.0',
          displayName: 'Docs Agent',
          description: 'Gerencia e sugere documentação',
          dependencies: { engines: ['documentation'] },
          metadata: { category: 'documentation', tags: ['docs', 'markdown'] },
        },
        source: 'builtin',
      },
      {
        manifest: {
          name: '@aios/agent-qa',
          version: '0.0.0',
          displayName: 'QA Agent',
          description: 'Sugere e valida testes',
          dependencies: {
            engines: ['context'],
            agents: [{ name: '@aios/agent-docs' }],
          },
          metadata: { category: 'testing', tags: ['qa', 'tests'] },
        },
        source: 'builtin',
      },
    ];
  }

  async parseManifest(manifestPath: string): Promise<AgentManifest> {
    const content = await fs.readFile(manifestPath, 'utf-8');
    const ext = path.extname(manifestPath);
    let manifest: AgentManifest;
    if (ext === '.yaml' || ext === '.yml') {
      manifest = yamlLoad(content) as AgentManifest;
    } else if (ext === '.json') {
      manifest = JSON.parse(content);
    } else {
      throw new Error(`Unsupported manifest format: ${ext}`);
    }
    return manifest;
  }

  validate(manifest: AgentManifest): ValidationResult {
    const valid = this.validateFn(manifest);
    if (valid) {
      return { valid: true, errors: [] };
    }
    const errors = this.validateFn.errors?.map((e) => `${e.instancePath} ${e.message}`) || [];
    return { valid: false, errors };
  }

  async listAgents(options?: {
    includeLocal?: boolean;
    includeNpm?: boolean;
    includeGit?: boolean;
    includeCommunity?: boolean;
  }): Promise<AgentEntry[]> {
    const opts = {
      includeLocal: true,
      includeNpm: true,
      includeGit: true,
      includeCommunity: true,
      ...options,
    };

    const agentsMap = new Map<string, AgentEntry>();

    // Add builtin first (lowest priority)
    for (const agent of this.builtinAgents) {
      agentsMap.set(agent.manifest.name, agent);
    }

    // Community catalog stubs (below saved registry / local)
    if (opts.includeCommunity) {
      const communityAgents = await this.resolveFromCommunity();
      for (const agent of communityAgents) {
        agentsMap.set(agent.manifest.name, agent);
      }
    }

    // Then add saved registry agents (next priority)
    try {
      const registryContent = await fs.readFile(this.registryPath, 'utf-8');
      const registryData = JSON.parse(registryContent);
      if (registryData.agents && Array.isArray(registryData.agents)) {
        for (const agent of registryData.agents) {
          agentsMap.set(agent.manifest.name, agent);
        }
      }
    } catch {
      // ignore if not exists
    }

    // Then add local agents (highest priority)
    if (opts.includeLocal) {
      const localAgents = await this.resolveFromLocal();
      for (const agent of localAgents) {
        agentsMap.set(agent.manifest.name, agent);
      }
    }

    return Array.from(agentsMap.values());
  }

  /**
   * Read-only community stubs from the committed / ingested catalog.
   * Does not clone or execute remote agent code.
   */
  async resolveFromCommunity(catalogPath?: string): Promise<AgentEntry[]> {
    const filePath = catalogPath || this.communityCatalogPath;
    const cacheKey = `community:${filePath}`;
    const cached = this.getCache<AgentEntry[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const catalog = JSON.parse(raw) as CommunityCatalog;
      if (!Array.isArray(catalog.agents)) return [];

      const entries: AgentEntry[] = catalog.agents.map((item) => {
        const name = `community:${item.fullName}`;
        const topics = item.topics || [];
        return {
          manifest: {
            name,
            version: '0.0.0',
            displayName: item.fullName,
            description: item.description || `Community agent from ${item.htmlUrl}`,
            metadata: {
              category: 'community',
              tags: topics.includes('aios-agent') ? topics : [...topics, 'aios-agent'],
              repository: item.htmlUrl,
              community: true,
              flags: item.flags || {},
              stargazers: item.stargazers ?? 0,
              pushedAt: item.pushedAt,
              manifestPath: item.manifestPath ?? null,
              catalogGeneratedAt: catalog.generatedAt,
            },
          },
          source: 'community',
          path: item.htmlUrl,
        };
      });

      this.setCache(cacheKey, entries);
      return entries;
    } catch {
      return [];
    }
  }

  async listAgentsFiltered(options?: {
    tags?: string[];
    maintainer?: string;
    name?: string;
  }): Promise<AgentEntry[]> {
    const agents = await this.listAgents();
    return agents.filter((agent) => {
      let pass = true;
      if (options?.tags?.length) {
        const agentTags = (agent.manifest.metadata?.tags as string[]) || [];
        pass = pass && options.tags.some((tag) => agentTags.includes(tag));
      }
      if (options?.maintainer) {
        const agentMaintainer = (agent.manifest.metadata?.maintainer as string) || '';
        pass = pass && agentMaintainer.includes(options.maintainer);
      }
      if (options?.name) {
        pass = pass && agent.manifest.name.toLowerCase().includes(options.name.toLowerCase());
      }
      return pass;
    });
  }

  async getAgent(name: string): Promise<AgentEntry | undefined> {
    const agents = await this.listAgents();
    return agents.find((a) => a.manifest.name === name);
  }

  async resolveDependencyTreeForAgent(
    rootName: string,
    options?: { maxDepth?: number; listOptions?: Parameters<AgentRegistry['listAgents']>[0] }
  ): Promise<AgentDependencyTreeNode | null> {
    const agents = await this.listAgents(options?.listOptions);
    return buildDependencyTree(rootName, agents, { maxDepth: options?.maxDepth });
  }

  async saveRegistry(agents: AgentEntry[]): Promise<void> {
    const dir = path.dirname(this.registryPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.registryPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          agents: agents.filter((a) => a.source !== 'builtin' && a.source !== 'community'),
        },
        null,
        2
      )
    );
  }

  // Cache helpers
  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // npm resolver
  async resolveFromNpm(packageName: string): Promise<AgentEntry> {
    const cacheKey = `npm:${packageName}`;
    const cached = this.getCache<AgentEntry>(cacheKey);
    if (cached) return cached;

    // Fetch package metadata from npm registry
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch npm package: ${packageName}`);
    }
    const npmData = await response.json();
    const latestVersion = npmData['dist-tags'].latest;
    const latestPkg = npmData.versions[latestVersion];

    // Try to find agent.yaml or agent.json in the package dist (simplified)
    // For now, assume manifest is in latestPkg's contents or use package.json as fallback
    let manifest: AgentManifest;
    try {
      // In real scenario, we'd fetch the tarball and extract, but for MVP:
      manifest = {
        name: packageName,
        version: latestVersion,
        displayName: latestPkg.name,
        description: latestPkg.description,
        metadata: {
          npm: {
            versions: Object.keys(npmData.versions),
            author: latestPkg.author,
            license: latestPkg.license,
          },
        },
      };
    } catch {
      throw new Error(`Failed to parse manifest from npm package: ${packageName}`);
    }

    const entry: AgentEntry = {
      manifest,
      source: 'npm',
    };
    this.setCache(cacheKey, entry);
    return entry;
  }

  // Git resolver
  async resolveFromGit(repoUrl: string, ref?: string): Promise<AgentEntry> {
    const cacheKey = `git:${repoUrl}:${ref || 'HEAD'}`;
    const cached = this.getCache<AgentEntry>(cacheKey);
    if (cached) return cached;

    // Clone repo into temp dir, parse manifest, get tags as versions
    const tempDir = path.join(process.cwd(), '.temp', `agent-git-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Clone repo
      await execFilePromise('git', ['clone', '--depth', '1', '--', repoUrl, tempDir]);
      if (ref) {
        await execFilePromise('git', ['checkout', ref], { cwd: tempDir });
      }

      // Parse agent.yaml/agent.json
      let manifestPath: string | null = null;
      for (const name of ['agent.yaml', 'agent.yml', 'agent.json']) {
        const p = path.join(tempDir, '.aios', name);
        if (await fs.stat(p).catch(() => false)) {
          manifestPath = p;
          break;
        }
        // Also check root
        const p2 = path.join(tempDir, name);
        if (await fs.stat(p2).catch(() => false)) {
          manifestPath = p2;
          break;
        }
      }
      if (!manifestPath) {
        throw new Error(`No agent manifest found in git repo: ${repoUrl}`);
      }

      const manifest = await this.parseManifest(manifestPath);

      // Get git tags as versions
      const { stdout: tagsStr } = await execFilePromise('git', ['tag', '--sort=-creatordate'], {
        cwd: tempDir,
      });
      const tags = tagsStr.split('\n').filter(Boolean);

      const entry: AgentEntry = {
        manifest: {
          ...manifest,
          metadata: {
            ...manifest.metadata,
            git: { repoUrl, ref: ref || 'HEAD', versions: tags },
          },
        },
        source: 'git',
        path: tempDir,
      };
      this.setCache(cacheKey, entry);
      return entry;
    } finally {
      // Cleanup temp dir (optional, but nice)
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  // Local resolver
  async resolveFromLocal(scanPath?: string): Promise<AgentEntry[]> {
    const basePath = scanPath || process.env.AIOS_AGENTS_PATH || path.join(process.cwd(), 'agents');
    const cacheKey = `local:${basePath}`;
    const cached = this.getCache<AgentEntry[]>(cacheKey);
    if (cached) return cached;

    const entries: AgentEntry[] = [];
    try {
      const stat = await fs.stat(basePath).catch(() => null);
      if (!stat?.isDirectory()) {
        return entries;
      }

      const subdirs = await fs.readdir(basePath);
      for (const dir of subdirs) {
        const dirPath = path.join(basePath, dir);
        const dirStat = await fs.stat(dirPath).catch(() => null);
        if (!dirStat?.isDirectory()) continue;

        // Find manifest in this directory
        let manifestPath: string | null = null;
        for (const name of ['agent.yaml', 'agent.yml', 'agent.json']) {
          const p = path.join(dirPath, '.aios', name);
          if (await fs.stat(p).catch(() => false)) {
            manifestPath = p;
            break;
          }
          const p2 = path.join(dirPath, name);
          if (await fs.stat(p2).catch(() => false)) {
            manifestPath = p2;
            break;
          }
        }
        if (!manifestPath) continue;

        try {
          const manifest = await this.parseManifest(manifestPath);
          entries.push({
            manifest,
            source: 'local',
            path: dirPath,
          });
        } catch {
          // Skip invalid manifests
        }
      }

      this.setCache(cacheKey, entries);
      return entries;
    } catch (err) {
      console.error(`Failed to scan local agents: ${(err as Error).message}`);
      return [];
    }
  }
}

export const VERSION = '0.1.0';
