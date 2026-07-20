import fs from 'fs/promises'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Ajv, { type ValidateFunction } from 'ajv'
import yaml from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const agentSchema = JSON.parse(readFileSync(path.join(__dirname, '../schema/agent.schema.json'), 'utf-8'))

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

export class AgentRegistry {
  private readonly ajv: ReturnType<typeof Ajv.default>
  private readonly validateFn: ValidateFunction
  private builtinAgents: AgentEntry[] = []
  private readonly registryPath: string

  constructor(options?: { registryPath?: string }) {
    this.ajv = new Ajv.default()
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
}

export const VERSION = '0.1.0'
