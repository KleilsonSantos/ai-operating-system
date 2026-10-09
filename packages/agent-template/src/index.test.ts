import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveTemplateDir, TEMPLATE_PACKAGE_NAME } from './index.js';

describe('resolveTemplateDir', () => {
  it('points at a directory that contains agent.yaml.tmpl', async () => {
    const dir = resolveTemplateDir();
    expect(path.isAbsolute(dir)).toBe(true);
    await fs.access(path.join(dir, 'agent.yaml.tmpl'));
    await fs.access(path.join(dir, 'package.json.tmpl'));
    await fs.access(path.join(dir, 'src', 'index.ts.tmpl'));
  });

  it('exports the public package name constant', () => {
    expect(TEMPLATE_PACKAGE_NAME).toBe('@aios-platform/agent-template');
  });
});
