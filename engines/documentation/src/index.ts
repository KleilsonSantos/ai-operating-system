/**
 * Documentation Engine — inventário / drift heurístico (#80).
 * Sem LLM: filesystem + paths canónicos. Distinto do plugin agent-docs.
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
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
