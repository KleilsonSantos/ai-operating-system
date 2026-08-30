/**
 * Resolve AIOS monorepo SemVer for MCP `serverInfo.version` (#337).
 * Walks from this package to the workspace root `package.json`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function readMonorepoVersion(fromUrl: string = import.meta.url): string {
  const here = dirname(fileURLToPath(fromUrl));
  // apps/mcp/src → apps/mcp → apps → repo root
  const rootPkg = join(here, '..', '..', '..', 'package.json');
  try {
    const raw = JSON.parse(readFileSync(rootPkg, 'utf8')) as { version?: unknown };
    if (typeof raw.version === 'string' && raw.version.trim()) {
      return raw.version.trim();
    }
  } catch {
    /* fall through */
  }
  return '0.0.0';
}
