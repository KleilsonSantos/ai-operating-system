import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AgentRegistry } from '@aios/agent-registry';
import { scaffoldAgent } from './scaffold.js';

describe('scaffoldAgent', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'aios-create-agent-'));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('scaffolds a valid agent package', async () => {
    const targetDir = path.join(tempRoot, 'out');
    const result = await scaffoldAgent({
      name: 'security-review',
      targetDir,
    });

    expect(result.packageName).toBe('@aios/agent-security-review');
    expect(result.manifestName).toBe('@aios/agent-security-review');
    expect(result.validation.valid).toBe(true);
    expect(result.files).toContain('agent.yaml');
    expect(result.files).toContain('package.json');
    expect(result.files).toContain('src/index.ts');
    expect(result.files).toContain('src/index.test.ts');
    expect(result.files).toContain('README.md');

    const yaml = await fs.readFile(path.join(targetDir, 'agent.yaml'), 'utf8');
    expect(yaml).toContain("name: '@aios/agent-security-review'");
    expect(yaml).toContain("version: '0.1.0'");

    const registry = new AgentRegistry({
      registryPath: path.join(tempRoot, 'agents.registry.json'),
    });
    const manifest = await registry.parseManifest(path.join(targetDir, 'agent.yaml'));
    expect(registry.validate(manifest).valid).toBe(true);
  });

  it('accepts scoped names as-is', async () => {
    const result = await scaffoldAgent({
      name: '@acme/threat-model',
      targetDir: path.join(tempRoot, 'scoped'),
    });
    expect(result.packageName).toBe('@acme/threat-model');
    expect(result.validation.valid).toBe(true);
  });

  it('rejects invalid names', async () => {
    await expect(
      scaffoldAgent({ name: 'Bad Name!', targetDir: path.join(tempRoot, 'bad') })
    ).rejects.toThrow(/Invalid agent name/);
  });

  it('refuses to overwrite an existing directory', async () => {
    const targetDir = path.join(tempRoot, 'exists');
    await fs.mkdir(targetDir);
    await expect(scaffoldAgent({ name: 'dup', targetDir })).rejects.toThrow(/already exists/);
  });
});
