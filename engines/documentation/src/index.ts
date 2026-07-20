/**
 * Documentation Engine — inventário / drift heurístico (#80).
 * Sem LLM: filesystem + paths canónicos. Distinto do plugin agent-docs.
 * PKB inventory: docs/prompts ladder step 2 (#154).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { DocFinding, DocumentationAudit } from '@aios/shared'

export type AuditDocumentationOptions = {
  repoPath?: string
}

/** Paths relativos canónicos do produto AIOS. */
export const CANONICAL_DOCS = [
  'README.md',
  'CHANGELOG.md',
  'AGENTS.md',
  'docs/FOUNDATION.md',
  'docs/VISION.md',
  'docs/ROADMAP.md',
  'docs/architecture/overview.md',
  'docs/architecture/system-guide.md',
  'policies/aios.policies.json',
] as const

/** Prompt Knowledge Base scaffold (MVP #134 · inventory #154). */
export const PKB_CANONICAL = [
  'docs/prompts/README.md',
  'docs/prompts/VISION.md',
  'docs/prompts/index.yaml',
] as const

const EXPECTED_ADRS = [
  'docs/adr/0001-standalone-platform.md',
  'docs/adr/0002-git-branching-strategy.md',
  'docs/adr/0003-pipeline-integration-contract.md',
]

function listEngineDirs(repoPath: string): string[] {
  const dir = join(repoPath, 'engines')
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((name) => {
    try {
      return statSync(join(dir, name)).isDirectory()
    } catch {
      return false
    }
  })
}

function listAdrFiles(repoPath: string): string[] {
  const dir = join(repoPath, 'docs', 'adr')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => `docs/adr/${f}`)
    .sort()
}

/** Recursively list `*.md` under a directory; returns paths relative to `repoPath`. */
function listMarkdownFiles(repoPath: string, relDir: string): string[] {
  const abs = join(repoPath, relDir)
  if (!existsSync(abs)) return []
  const out: string[] = []
  const walk = (dir: string, rel: string) => {
    for (const name of readdirSync(dir)) {
      const childAbs = join(dir, name)
      const childRel = rel ? `${rel}/${name}` : name
      try {
        if (statSync(childAbs).isDirectory()) {
          walk(childAbs, childRel)
        } else if (name.endsWith('.md')) {
          out.push(childRel)
        }
      } catch {
        /* skip unreadable */
      }
    }
  }
  walk(abs, relDir)
  return out.sort()
}

/**
 * Parse `path:` entries from PKB `index.yaml` without a YAML dependency (KISS).
 * Expects lines like `    path: by-domain/foo/bar.v1.md`.
 */
export function parsePkbIndexPaths(indexYaml: string): string[] {
  const paths: string[] = []
  for (const line of indexYaml.split(/\r?\n/)) {
    const m = /^\s+path:\s+(\S+)\s*$/.exec(line)
    if (m?.[1]) paths.push(m[1].replace(/^['"]|['"]$/g, ''))
  }
  return paths
}

/** Inventory Prompt Knowledge Base catalog vs filesystem (#154). */
export function auditPkbInventory(
  repoPath: string,
  findings: DocFinding[],
  present: string[],
  missing: string[],
): void {
  for (const rel of PKB_CANONICAL) {
    if (existsSync(join(repoPath, rel))) {
      if (!present.includes(rel)) present.push(rel)
    } else {
      if (!missing.includes(rel)) missing.push(rel)
      findings.push({
        id: `pkb-missing-${rel.replace(/[^\w]+/g, '-')}`,
        severity: 'warn',
        title: `PKB scaffold missing: ${rel}`,
        detail: 'Expected Prompt Knowledge Base Docs-as-Code layout (#134).',
        path: rel,
      })
    }
  }

  const indexRel = 'docs/prompts/index.yaml'
  const indexAbs = join(repoPath, indexRel)
  if (!existsSync(indexAbs)) return

  let indexed: string[] = []
  try {
    indexed = parsePkbIndexPaths(readFileSync(indexAbs, 'utf8'))
  } catch {
    findings.push({
      id: 'pkb-index-unreadable',
      severity: 'warn',
      title: 'Could not read docs/prompts/index.yaml',
      detail: 'PKB inventory skipped for indexed paths.',
      path: indexRel,
    })
    return
  }

  const resolved: string[] = []
  for (const entry of indexed) {
    const rel = entry.startsWith('docs/prompts/')
      ? entry
      : `docs/prompts/${entry}`
    if (existsSync(join(repoPath, rel))) {
      resolved.push(rel)
      if (!present.includes(rel)) present.push(rel)
    } else {
      if (!missing.includes(rel)) missing.push(rel)
      findings.push({
        id: `pkb-index-missing-${rel.replace(/[^\w]+/g, '-')}`,
        severity: 'warn',
        title: `PKB index path missing: ${rel}`,
        detail: 'Listed in docs/prompts/index.yaml but file not found.',
        path: rel,
      })
    }
  }

  findings.push({
    id: 'pkb-index-count',
    severity: 'info',
    title: `PKB index: ${resolved.length}/${indexed.length} asset(s) on disk`,
    detail:
      indexed.length === 0
        ? 'index.yaml has no path: entries'
        : resolved.slice(0, 5).join(', ') +
          (resolved.length > 5 ? ', …' : ''),
  })

  const onDisk = listMarkdownFiles(repoPath, 'docs/prompts/by-domain')
  const indexedSet = new Set(
    indexed.map((e) =>
      e.startsWith('docs/prompts/') ? e : `docs/prompts/${e}`,
    ),
  )
  const orphans = onDisk.filter((rel) => !indexedSet.has(rel))
  if (orphans.length > 0) {
    findings.push({
      id: 'pkb-orphan-assets',
      severity: 'info',
      title: `${orphans.length} PKB markdown asset(s) not in index.yaml`,
      detail: orphans.slice(0, 8).join(', ') + (orphans.length > 8 ? ', …' : ''),
    })
  }
}

export function auditDocumentation(
  options: AuditDocumentationOptions = {},
): DocumentationAudit {
  const repoPath = resolve(options.repoPath || process.cwd())
  const present: string[] = []
  const missing: string[] = []
  const findings: DocFinding[] = []

  for (const rel of CANONICAL_DOCS) {
    const abs = join(repoPath, rel)
    if (existsSync(abs)) {
      present.push(rel)
    } else {
      missing.push(rel)
      findings.push({
        id: `missing-${rel.replace(/[^\w]+/g, '-')}`,
        severity: rel.includes('FOUNDATION') || rel === 'README.md' ? 'error' : 'warn',
        title: `Doc canónica em falta: ${rel}`,
        detail: 'Esperado na pedra base / estrutura do produto.',
        path: rel,
      })
    }
  }

  for (const rel of EXPECTED_ADRS) {
    if (!existsSync(join(repoPath, rel))) {
      findings.push({
        id: `missing-adr-${rel}`,
        severity: 'warn',
        title: `ADR base em falta: ${rel}`,
        detail: 'ADRs fundacionais do fluxo AIOS.',
        path: rel,
      })
      if (!missing.includes(rel)) missing.push(rel)
    } else if (!present.includes(rel)) {
      present.push(rel)
    }
  }

  const adrs = listAdrFiles(repoPath)
  if (adrs.length === 0) {
    findings.push({
      id: 'no-adrs',
      severity: 'error',
      title: 'Nenhum ADR em docs/adr',
      detail: 'Decisões arquiteturais devem ficar em ADR.',
    })
  } else {
    findings.push({
      id: 'adr-count',
      severity: 'info',
      title: `${adrs.length} ADR(s) presentes`,
      detail: adrs.slice(-5).join(', '),
    })
  }

  const engines = listEngineDirs(repoPath)
  const guide = join(repoPath, 'docs', 'architecture', 'system-guide.md')
  if (existsSync(guide) && engines.includes('documentation')) {
    findings.push({
      id: 'engine-documentation',
      severity: 'info',
      title: 'Engine documentation presente',
      detail: 'engines/documentation — alinhado ao ROADMAP Fase 3.',
    })
  }

  if (!engines.includes('documentation') || !engines.includes('governance')) {
    findings.push({
      id: 'engines-phase3',
      severity: 'info',
      title: 'Engines Fase 3',
      detail: `documentation=${engines.includes('documentation')} governance=${engines.includes('governance')}`,
    })
  }

  const policies = join(repoPath, 'policies', 'aios.policies.json')
  if (!existsSync(policies)) {
    findings.push({
      id: 'policies-missing',
      severity: 'error',
      title: 'policies/aios.policies.json em falta',
      detail: 'Fonte de verdade operacional do Policy Engine.',
      path: 'policies/aios.policies.json',
    })
  }

  auditPkbInventory(repoPath, findings, present, missing)

  const ok = !findings.some((f) => f.severity === 'error')

  return {
    generatedAt: new Date().toISOString(),
    repoPath,
    present,
    missing,
    findings,
    ok,
  }
}
