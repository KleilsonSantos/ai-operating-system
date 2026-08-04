/**
 * Scaffold a new AIOS agent package from the built-in template.
 * Phase 5b / ADR-0023 · Issue #211
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AgentRegistry } from '@aios/agent-registry';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Default template root (sibling of src/). */
export function defaultTemplateDir(): string {
  return path.join(__dirname, '..', 'template');
}

export interface ScaffoldOptions {
  /** Agent short name or scoped name (`my-agent` or `@org/my-agent`). */
  name: string;
  /** Directory to create (defaults to cwd / package folder name). */
  targetDir?: string;
  /** Override template directory (tests). */
  templateDir?: string;
  /** Skip registry validation of generated agent.yaml. */
  skipValidate?: boolean;
}

export interface ScaffoldResult {
  targetDir: string;
  packageName: string;
  manifestName: string;
  files: string[];
  validation: { valid: boolean; errors: string[] };
}

const NAME_RE = /^(@[a-zA-Z0-9][a-zA-Z0-9-]*\/)?[a-zA-Z0-9][a-zA-Z0-9-]*$/;

function normalizeNames(raw: string): {
  packageName: string;
  manifestName: string;
  dirName: string;
  displayName: string;
} {
  const trimmed = raw.trim();
  if (!NAME_RE.test(trimmed)) {
    throw new Error(
      `Invalid agent name "${raw}". Use kebab-case, optionally scoped (e.g. my-agent or @aios/my-agent).`
    );
  }

  const scoped = trimmed.includes('/');
  const short = scoped ? trimmed.split('/')[1]! : trimmed;
  const packageName = scoped ? trimmed : `@aios/agent-${short.replace(/^agent-/, '')}`;
  const manifestName = packageName;
  const dirName = short.replace(/^agent-/, '') || short;
  const displayName = short
    .replace(/^agent-/, '')
    .split('-')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

  return {
    packageName,
    manifestName,
    dirName: `agent-${dirName}`,
    displayName: displayName || short,
  };
}

async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        out.push(full);
      }
    }
  }
  await walk(root);
  return out;
}

function applyTokens(content: string, tokens: Record<string, string>): string {
  let next = content;
  for (const [key, value] of Object.entries(tokens)) {
    next = next.split(`{{${key}}}`).join(value);
  }
  return next;
}

/**
 * Create an agent package from the template.
 */
export async function scaffoldAgent(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const names = normalizeNames(options.name);
  const cwd = process.cwd();
  const targetDir = path.resolve(options.targetDir ?? path.join(cwd, names.dirName));
  const templateDir = options.templateDir ?? defaultTemplateDir();

  await fs.access(templateDir).catch(() => {
    throw new Error(`Template directory not found: ${templateDir}`);
  });

  try {
    await fs.access(targetDir);
    throw new Error(`Target directory already exists: ${targetDir}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }

  const tokens: Record<string, string> = {
    PACKAGE_NAME: names.packageName,
    MANIFEST_NAME: names.manifestName,
    DISPLAY_NAME: names.displayName,
    DESCRIPTION: `${names.displayName} agent plugin for AIOS`,
    VERSION: '0.1.0',
  };

  const templateFiles = await walkFiles(templateDir);
  const written: string[] = [];

  for (const abs of templateFiles) {
    const rel = path.relative(templateDir, abs);
    const destRel = rel.endsWith('.tmpl') ? rel.slice(0, -'.tmpl'.length) : rel;
    const dest = path.join(targetDir, destRel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const raw = await fs.readFile(abs, 'utf8');
    await fs.writeFile(dest, applyTokens(raw, tokens), 'utf8');
    written.push(destRel);
  }

  let validation: { valid: boolean; errors: string[] } = { valid: true, errors: [] };
  if (!options.skipValidate) {
    const registry = new AgentRegistry({
      registryPath: path.join(targetDir, '.registry-unused.json'),
    });
    const manifestPath = path.join(targetDir, 'agent.yaml');
    const manifest = await registry.parseManifest(manifestPath);
    validation = registry.validate(manifest);
    if (!validation.valid) {
      throw new Error(`Generated agent.yaml failed validation:\n${validation.errors.join('\n')}`);
    }
  }

  return {
    targetDir,
    packageName: names.packageName,
    manifestName: names.manifestName,
    files: written.sort(),
    validation,
  };
}
