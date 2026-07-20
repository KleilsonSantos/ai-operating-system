import fs from 'fs/promises'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Ajv from 'ajv'
import yaml from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const agentSchema = JSON.parse(readFileSync(path.join(__dirname, '../schema/agent.schema.json'), 'utf-8'))
const AjvConstructor = Ajv as unknown as new () => any
type ValidateFunction = (data: any) => boolean

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
  versions?: string[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const cache: Map<string, CacheEntry<any>> = new Map()

export class AgentRegistry {
  private readonly ajv: any
  private readonly validateFn: ValidateFunction
  private builtinAgents: AgentEntry[] = []
  private readonly registryPath: string

  constructor(options?: { registryPath?: string }) {
    this.ajv = new AjvConstructor()
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
    const errors = (this.ajv.errors || []).map((e: any) => `${e.instancePath} ${e.message}`)
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

  private async getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    const data = await fetchFn()
    cache.set(key, { data, timestamp: Date.now() })
    return data
  }

  async resolveLocalAgents(agentsPath?: string): Promise<AgentEntry[]> {
    const pathToScan = agentsPath || process.env.AIOS_AGENTS_PATH || './agents'
    const entries: AgentEntry[] = []

    if (!existsSync(pathToScan)) {
      return entries
    }

    const dirents = await fs.readdir(pathToScan, { withFileTypes: true })
    for (const dirent of dirents) {
      if (dirent.isDirectory()) {
        const agentDir = path.join(pathToScan, dirent.name)
        const yamlPath = path.join(agentDir, '.aios', 'agent.yaml')
        const jsonPath = path.join(agentDir, '.aios', 'agent.json')
        
        let manifestPath: string | undefined
        if (existsSync(yamlPath)) {
          manifestPath = yamlPath
        } else if (existsSync(jsonPath)) {
          manifestPath = jsonPath
        }
        
        if (manifestPath) {
          try {
            const manifest = await this.parseManifest(manifestPath)
            const validation = this.validate(manifest)
            if (validation.valid) {
              entries.push({
                manifest,
                source: 'local',
                path: agentDir
              })
            }
          } catch (err) {
            // Skip invalid agents
          }
        }
      }
    }

    return entries
  }

  async resolveNpmAgent(packageName: string): Promise<AgentEntry | null> {
    return this.getCached(`npm:${packageName}`, async () => {
      try {
        const response = await fetch(`https://registry.npmjs.org/${packageName}`)
        if (!response.ok) return null
        const pkgData = await response.json() as any
        const latestVersion = pkgData['dist-tags']?.latest
        if (!latestVersion) return null
        
        const versionData = pkgData.versions?.[latestVersion]
        if (!versionData) return null
        
        const manifest: AgentManifest = {
          name: packageName,
          version: latestVersion,
          displayName: versionData.name,
          description: versionData.description,
          metadata: {
            keywords: versionData.keywords,
            author: versionData.author,
            homepage: versionData.homepage
          }
        }
        
        const versions = Object.keys(pkgData.versions || {})
        return {
          manifest,
          source: 'npm',
          versions
        }
      } catch (err) {
        return null
      }
    })
  }

  async resolveGitAgent(repoUrl: string): Promise<AgentEntry | null> {
    return this.getCached(`git:${repoUrl}`, async () => {
      // For now, placeholder implementation - full git cloning would be more complex
      try {
        // Extract owner and repo from URL like https://github.com/owner/repo
        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/)
        if (!match) return null
        const [, owner, repo] = match
        
        // Fetch repository info from GitHub API
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
        if (!response.ok) return null
        const repoData = await response.json() as any
        
        const manifest: AgentManifest = {
          name: repoData.full_name,
          version: '0.0.0',
          displayName: repoData.name,
          description: repoData.description,
          metadata: {
            owner,
            repo,
            stars: repoData.stargazers_count,
            homepage: repoData.homepage
          }
        }
        
        return {
          manifest,
          source: 'git'
        }
      } catch (err) {
        return null
      }
    })
  }
}

export const VERSION = '0.1.0'
