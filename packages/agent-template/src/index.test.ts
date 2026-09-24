import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { resolveTemplateDir, TEMPLATE_PACKAGE_NAME } from './index.js';

describe('resolveTemplateDir (#532)', () => {
  it('points at a directory with expected scaffold files', () => {
    const dir = resolveTemplateDir();
    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.existsSync(path.join(dir, 'agent.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src', 'index.ts'))).toBe(true);
    expect(TEMPLATE_PACKAGE_NAME).toBe('@aios-platform/agent-template');
  });
});
