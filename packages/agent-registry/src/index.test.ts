import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { AgentRegistry } from './index.js'

describe('AgentRegistry', () => {
  let tempDir: string
  let registryPath: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aios-agent-registry-'))
    registryPath = path.join(tempDir, 'agents.registry.json')
  })

  it('should initialize with built-in agents', async () => {
    const registry = new AgentRegistry({ registryPath })
    const agents = await registry.listAgents()
    expect(agents.length).toBe(4)
    expect(agents.some(a => a.manifest.name === '@aios/agent-architecture')).toBe(true)
  })

  it('should validate a correct manifest', () => {
    const registry = new AgentRegistry({ registryPath })
    const result = registry.validate({
      name: 'test-agent',
      version: '1.0.0'
    })
    expect(result.valid).toBe(true)
  })

  it('should validate an incorrect manifest', () => {
    const registry = new AgentRegistry({ registryPath })
    const result = registry.validate({
      name: 123,
      version: 'not a semver'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should get an agent by name', async () => {
    const registry = new AgentRegistry({ registryPath })
    const agent = await registry.getAgent('@aios/agent-qa')
    expect(agent).toBeDefined()
    expect(agent?.manifest.displayName).toBe('QA Agent')
  })
})
