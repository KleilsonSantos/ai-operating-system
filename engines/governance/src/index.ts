/**
 * Governance Engine — auditoria leve de decisões (#80).
 * Store local JSONL (Resource-Aware). Não substitui IDE nem agentes no UX.
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  AttentionItem,
  GovernanceAudit,
  GovernanceDecision,
} from '@aios/shared'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { auditDocumentation } from '@aios/documentation'

export type GovernanceOptions = {
  homePath?: string
  storeDir?: string
}

export type RecordDecisionInput = {
  kind: string
  summary: string
  policyIds?: string[]
  verdict?: GovernanceDecision['verdict']
  source?: string
}

function resolveHome(homePath?: string): string {
  return resolve(homePath || process.env.AIOS_HOME || process.cwd())
}

function defaultStoreDir(homePath: string): string {
  return join(homePath, '.aios', 'governance')
}

function decisionsPath(storeDir: string): string {
  return join(storeDir, 'decisions.jsonl')
}

export function recordDecision(
  input: RecordDecisionInput,
  options: GovernanceOptions = {},
): GovernanceDecision {
  const home = resolveHome(options.homePath)
  const storeDir = options.storeDir || defaultStoreDir(home)
  mkdirSync(storeDir, { recursive: true })
  const entry: GovernanceDecision = {
    id: randomUUID(),
    at: new Date().toISOString(),
    kind: input.kind.trim() || 'note',
    summary: input.summary.trim(),
    policyIds: input.policyIds,
    verdict: input.verdict || 'info',
    source: input.source || 'governance',
  }
  if (!entry.summary) throw new Error('summary required')
  appendFileSync(decisionsPath(storeDir), `${JSON.stringify(entry)}\n`, 'utf8')
  return entry
}

export function listDecisions(
  options: GovernanceOptions & { limit?: number } = {},
): { path: string; decisions: GovernanceDecision[] } {
  const home = resolveHome(options.homePath)
  const storeDir = options.storeDir || defaultStoreDir(home)
  const path = decisionsPath(storeDir)
  const limit = options.limit ?? 20
  if (!existsSync(path)) return { path, decisions: [] }
  try {
    const lines = readFileSync(path, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
    const parsed: GovernanceDecision[] = []
    for (const line of lines) {
      try {
        parsed.push(JSON.parse(line) as GovernanceDecision)
      } catch {
        /* skip bad line */
      }
    }
    return { path, decisions: parsed.slice(-limit).reverse() }
  } catch {
    return { path, decisions: [] }
  }
}

export type AuditGovernanceOptions = GovernanceOptions & {
  repoPath?: string
  includeDocumentation?: boolean
  decisionLimit?: number
}

export function auditGovernance(
  options: AuditGovernanceOptions = {},
): GovernanceAudit {
  const homePath = resolveHome(options.homePath)
  const repoPath = resolve(options.repoPath || homePath)
  const bundle = loadPolicies({ cwd: repoPath })
  const applied = applyPolicies(bundle.rules)
  const listed = listDecisions({
    homePath,
    storeDir: options.storeDir,
    limit: options.decisionLimit ?? 10,
  })

  const findings: AttentionItem[] = []

  if (applied.mustIds.length === 0) {
    findings.push({
      id: 'gov-no-must',
      severity: 'warn',
      title: 'Sem policies must',
      detail: 'Governance sem âncora de must policies.',
    })
  }

  if (listed.decisions.length === 0) {
    findings.push({
      id: 'gov-no-decisions',
      severity: 'info',
      title: 'Nenhuma decisão registada',
      detail: `Store vazio: ${listed.path}. Use recordDecision / MCP.`,
    })
  }

  let documentation: GovernanceAudit['documentation']
  if (options.includeDocumentation !== false) {
    const docs = auditDocumentation({ repoPath })
    documentation = {
      ok: docs.ok,
      findingCount: docs.findings.length,
    }
    if (!docs.ok) {
      findings.push({
        id: 'gov-docs-drift',
        severity: 'warn',
        title: 'Documentation audit com erros',
        detail: `${docs.findings.filter((f) => f.severity === 'error').length} erro(s) de docs — corre aios_audit_docs.`,
      })
    }
  }

  const ok = !findings.some((f) => f.severity === 'error')

  return {
    generatedAt: new Date().toISOString(),
    homePath,
    repoPath,
    policies: {
      mustIds: applied.mustIds,
      count: bundle.rules.length,
    },
    decisions: {
      path: listed.path,
      count: listed.decisions.length,
      recent: listed.decisions,
    },
    documentation,
    findings,
    ok,
  }
}
