import fs from 'fs/promises'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { default as Ajv, type ValidateFunction } from 'ajv'
import yaml from 'js-yaml'
import { exec } from 'child_process'
import { promisify } from 'util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const agentSchema = JSON.parse(readFileSync(path.join(__dirname, '../schema/agent.schema.json'), 'utf-8'))
const execPromise = promisify(exec)
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export interface AgentManifest {
  name: string
  version: string
  displayName?: string
  description?: string
  inputs?: Record<string, { type: string; description?: string; required?: boolean; default?: unknown }>
  outputs?: Record<string, { type: string; description?: string }>
  dependencies?: { agents?: Array<{ name: string; version?: string }>; engines?: string[] }
  metadata?: Record<string, unknown>
}

export interface AgentEntry {
  manifest: AgentManifest
  source: 'builtin' | 'local' | 'npm' | 'git'
  path?: string
  healthScore?: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

export class AgentRegistry {
  private readonly ajv: any
  private readonly validateFn: ValidateFunction
  private builtinAgents: AgentEntry[] = []
  private readonly registryPath: string
  private readonly cache: Map<string, CacheEntry<unknown>> = new Map()

  constructor(options?: { registryPath?: string }) {
    this.ajv = new (Ajv as any)()
    this.validateFn = this.ajv.compile(agentSchema)
    this.registryPath = options?.registryPath || path.join(process.cwd(), '.aios', 'agents.registry.json')
    this.initBuiltinAgents()
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
          metadata: { category: 'analysis', tags: ['architecture', 'design'] }
        },
        source: 'builtin'
      },
      {
        manifest: {
          name: '@aios/agent-appsec',
          version: '0.0.0',
          displayName: 'AppSec Agent',
          description: 'Audita segurança do código e infraestrutura',
          dependencies: { engines: ['context'] },
          metadata: { category: 'security', tags: ['security', 'audit'] }
        },
        source: 'builtin'
      },
      {
        manifest: {
          name: '@aios/agent-docs',
          version: '0.0.0',
          displayName: 'Docs Agent',
          description: 'Gerencia e sugere documentação',
          dependencies: { engines: ['documentation'] },
          metadata: { category: 'documentation', tags: ['docs', 'markdown'] }
        },
        source: 'builtin'
      },
      {
        manifest: {
          name: '@aios/agent-qa',
          version: '0.0.0',
          displayName: 'QA Agent',
          description: 'Sugere e valida testes',
          dependencies: { engines: ['context'] },
          metadata: { category: 'testing', tags: ['qa', 'tests'] }
        },
        source: 'builtin'
      }
    ]
  }

  async parseManifest(manifestPath: string): Promise<AgentManifest> {
    const content = await fs.readFile(manifestPath, 'utf-8')
    const ext = path.extname(manifestPath)
    let manifest: AgentManifest
    if (ext === '.yaml' || ext === '.yml') {
      manifest = yaml.load(content) as AgentManifest
    } else if (ext === '.json') {
      manifest = JSON.parse(content)
    } else {
      throw new Error(`Unsupported manifest format: ${ext}`)
    }
    return manifest
  }

  validate(manifest: AgentManifest): ValidationResult {
    const valid = this.validateFn(manifest)
    if (valid) {
      return { valid: true, errors: [] }
    }
    const errors = this.validateFn.errors?.map(e => `${e.instancePath} ${e.message}`) || []
    return { valid: false, errors }
  }

  async listAgents(): Promise<AgentEntry[]> {
    const agents: AgentEntry[] = [...this.builtinAgents]
    try {
      const registryContent = await fs.readFile(this.registryPath, 'utf-8')
      const registryData = JSON.parse(registryContent)
      if (registryData.agents && Array.isArray(registryData.agents)) {
        agents.push(...registryData.agents)
      }
    } catch (err) {
    }
    return agents
  }

  async getAgent(name: string): Promise<AgentEntry | undefined> {
    const agents = await this.listAgents()
    return agents.find(a => a.manifest.name === name)
  }

  async saveRegistry(agents: AgentEntry[]): Promise<void> {
    const dir = path.dirname(this.registryPath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(this.registryPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      agents: agents.filter(a => a.source !== 'builtin')
    }, null, 2))
  }

  // Cache helpers
  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  // npm resolver
  async resolveFromNpm(packageName: string): Promise<AgentEntry> {
    const cacheKey = `npm:${packageName}`
    const cached = this.getCache<AgentEntry>(cacheKey)
    if (cached) return cached

    // Fetch package metadata from npm registry
    const response = await fetch(`https://registry.npmjs.org/${packageName}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch npm package: ${packageName}`)
    }
    const npmData = await response.json()
    const latestVersion = npmData['dist-tags'].latest
    const latestPkg = npmData.versions[latestVersion]

    // Try to find agent.yaml or agent.json in the package dist (simplified)
    // For now, assume manifest is in latestPkg's contents or use package.json as fallback
    let manifest: AgentManifest
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
            license: latestPkg.license
          }
        }
      }
    } catch (err) {
      throw new Error(`Failed to parse manifest from npm package: ${packageName}`)
    }

    const entry: AgentEntry = {
      manifest,
      source: 'npm'
    }
    this.setCache(cacheKey, entry)
    return entry
  }

  // Git resolver
  async resolveFromGit(repoUrl: string, ref?: string): Promise<AgentEntry> {
    const cacheKey = `git:${repoUrl}:${ref || 'HEAD'}`
    const cached = this.getCache<AgentEntry>(cacheKey)
    if (cached) return cached

    // Clone repo into temp dir, parse manifest, get tags as versions
    const tempDir = path.join(process.cwd(), '.temp', `agent-git-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })
    
    try {
      // Clone repo
      await execPromise(`git clone --depth 1 ${repoUrl} ${tempDir}`)
      if (ref) {
        await execPromise(`cd ${tempDir} && git checkout ${ref}`)
      }

      // Parse agent.yaml/agent.json
      let manifestPath: string | null = null
      for (const name of ['agent.yaml', 'agent.yml', 'agent.json']) {
        const p = path.join(tempDir, '.aios', name)
        if (await fs.stat(p).catch(() => false)) {
          manifestPath = p
          break
        }
        // Also check root
        const p2 = path.join(tempDir, name)
        if (await fs.stat(p2).catch(() => false)) {
          manifestPath = p2
          break
        }
      }
      if (!manifestPath) {
        throw new Error(`No agent manifest found in git repo: ${repoUrl}`)
      }

      const manifest = await this.parseManifest(manifestPath)

      // Get git tags as versions
      const { stdout: tagsStr } = await execPromise(`cd ${tempDir} && git tag --sort=-creatordate`)
      const tags = tagsStr.split('\n').filter(Boolean)

      const entry: AgentEntry = {
        manifest: {
          ...manifest,
          metadata: {
            ...manifest.metadata,
            git: { repoUrl, ref: ref || 'HEAD', versions: tags }
          }
        },
        source: 'git',
        path: tempDir
      }
      this.setCache(cacheKey, entry)
      return entry
    } finally {
      // Cleanup temp dir (optional, but nice)
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  }

  // Local resolver
  async resolveFromLocal(scanPath?: string): Promise<AgentEntry[]> {
    const basePath = scanPath || process.env.AIOS_AGENTS_PATH || path.join(process.cwd(), 'agents')
    const cacheKey = `local:${basePath}`
    const cached = this.getCache<AgentEntry[]>(cacheKey)
    if (cached) return cached

    const entries: AgentEntry[] = []
    try {
      const stat = await fs.stat(basePath).catch(() => null)
      if (!stat?.isDirectory()) {
        return entries
      }
      
      const subdirs = await fs.readdir(basePath)
      for (const dir of subdirs) {
        const dirPath = path.join(basePath, dir)
        const dirStat = await fs.stat(dirPath).catch(() => null)
        if (!dirStat?.isDirectory()) continue

        // Find manifest in this directory
        let manifestPath: string | null = null
        for (const name of ['agent.yaml', 'agent.yml', 'agent.json']) {
          const p = path.join(dirPath, '.aios', name)
          if (await fs.stat(p).catch(() => false)) {
            manifestPath = p
            break
          }
          const p2 = path.join(dirPath, name)
          if (await fs.stat(p2).catch(() => false)) {
            manifestPath = p2
            break
          }
        }
        if (!manifestPath) continue

        try {
          const manifest = await this.parseManifest(manifestPath)
          entries.push({
            manifest,
            source: 'local',
            path: dirPath
          })
        } catch (_) {
          // Skip invalid manifests
        }
      }

      this.setCache(cacheKey, entries)
      return entries
    } catch (err) {
      console.error(`Failed to scan local agents: ${(err as Error).message}`)
      return []
    }
  }
}

export const VERSION = '0.1.0'
