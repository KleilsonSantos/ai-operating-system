/**
 * Canonical agent package template for AIOS scaffolder (#532 / ADR-0023).
 * Files live under `template/`; create-agent applies `{{TOKENS}}`.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Absolute path to the template directory shipped with this package. */
export function resolveTemplateDir(): string {
  return path.join(packageRoot, 'template');
}

export const TEMPLATE_PACKAGE_NAME = '@aios-platform/agent-template' as const;
