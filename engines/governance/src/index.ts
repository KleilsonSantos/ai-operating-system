/**
 * Governance Engine — decision trail + hardened audit (#80 / #121 / ADR-0020).
 * Local JSONL store (Resource-Aware). Does not replace IDE agents in primary UX.
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

/** Canonical decision kinds (others allowed with audit signal). */
export const KNOWN_DECISION_KINDS = [
  'policy',
  'adr',
  'release',
  'exception',
  'note',
  'audit',
] as const

export type KnownDecisionKind = (typeof KNOWN_DECISION_KINDS)[number]

/**
 * Core must policies expected on a healthy AIOS control-plane home.
 * Missing ids → warn (does not fail the audit alone).
 */
export const PLATFORM_CORE_MUST_IDS = [
  'official-docs',
  'trade-offs',
  'no-overengineering',
  'resource-first',
  'git-flow-sandbox',
  'conventional-commits',
  'agents-as-plugins',
  'docs-language-en',
] as const

function resolveHome(homePath?: string): string {
  return resolve(homePath || process.env.AIOS_HOME || process.cwd())
}

function defaultStoreDir(homePath: string): string {
  return join(homePath, '.aios', 'governance')
}

function decisionsPath(storeDir: string): string {
  return join(storeDir, 'decisions.jsonl')
}

function normalizeKind(kind: string): string {
  return kind.trim().toLowerCase() || 'note'
}

export function isKnownDecisionKind(kind: string): boolean {
  return (KNOWN_DECISION_KINDS as readonly string[]).includes(
    normalizeKind(kind),
  )
}

export function recordDecision(
  input: RecordDecisionInput,
  options: GovernanceOptions = {},
): GovernanceDecision {
  const home = resolveHome(options.homePath)
  const storeDir = options.storeDir || defaultStoreDir(home)
  mkdirSync(storeDir, { recursive: true })
  const kind = normalizeKind(input.kind)
  const summary = input.summary.trim()
  if (!summary) throw new Error('summary required')
  const verdict = input.verdict || 'info'
  if (verdict !== 'pass' && verdict !== 'fail' && verdict !== 'info') {
    throw new Error('verdict must be pass | fail | info')
  }
  const policyIds = input.policyIds
    ?.map((id) => id.trim())
    .filter(Boolean)
  const entry: GovernanceDecision = {
    id: randomUUID(),
    at: new Date().toISOString(),
    kind,
    summary,
    policyIds: policyIds?.length ? policyIds : undefined,
    verdict,
    source: input.source || 'governance',
  }
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
  const knownPolicyIds = new Set(bundle.rules.map((r) => r.id))
  const listed = listDecisions({
    homePath,
    storeDir: options.storeDir,
    limit: options.decisionLimit ?? 20,
  })

  const findings: AttentionItem[] = []

  if (applied.mustIds.length === 0) {
    findings.push({
      id: 'gov-no-must',
      severity: 'warn',
      title: 'No must policies',
      detail: 'Governance has no must-policy anchor. Load policies/aios.policies.json.',
    })
  }

  const missingCoreMustIds = PLATFORM_CORE_MUST_IDS.filter(
    (id) => !applied.mustIds.includes(id),
  )
  if (missingCoreMustIds.length > 0 && applied.mustIds.length > 0) {
    findings.push({
      id: 'gov-missing-core-must',
      severity: 'warn',
      title: `Missing core must policies (${missingCoreMustIds.length})`,
      detail: `Expected platform core: ${missingCoreMustIds.join(', ')}.`,
    })
  }

  if (listed.decisions.length === 0) {
    findings.push({
      id: 'gov-no-decisions',
      severity: 'info',
      title: 'No decisions recorded',
      detail: `Empty store: ${listed.path}. Use recordDecision / aios_governance_record.`,
    })
  }

  const failDecisions = listed.decisions.filter((d) => d.verdict === 'fail')
  if (failDecisions.length > 0) {
    findings.push({
      id: 'gov-fail-verdicts',
      severity: 'error',
      title: `Failed governance decisions (${failDecisions.length})`,
      detail: failDecisions
        .slice(0, 3)
        .map((d) => `${d.kind}: ${d.summary}`)
        .join(' · '),
    })
  }

  const unknownPolicyIds = new Set<string>()
  const unknownKinds = new Set<string>()
  for (const d of listed.decisions) {
    if (!isKnownDecisionKind(d.kind)) unknownKinds.add(d.kind)
    for (const pid of d.policyIds || []) {
      if (!knownPolicyIds.has(pid)) unknownPolicyIds.add(pid)
    }
  }

  if (unknownPolicyIds.size > 0) {
    findings.push({
      id: 'gov-unknown-policy-ref',
      severity: 'warn',
      title: 'Decisions reference unknown policy ids',
      detail: [...unknownPolicyIds].slice(0, 8).join(', '),
    })
  }

  if (unknownKinds.size > 0) {
    findings.push({
      id: 'gov-unknown-kind',
      severity: 'info',
      title: 'Non-canonical decision kinds',
      detail: `Prefer ${KNOWN_DECISION_KINDS.join('|')}. Seen: ${[...unknownKinds].join(', ')}.`,
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
        title: 'Documentation audit has errors',
        detail: `${docs.findings.filter((f) => f.severity === 'error').length} doc error(s) — run aios_audit_docs.`,
      })
    }
  }

  const rank = { error: 0, warn: 1, info: 2 } as const
  findings.sort((a, b) => rank[a.severity] - rank[b.severity])

  const ok = !findings.some((f) => f.severity === 'error')

  return {
    generatedAt: new Date().toISOString(),
    homePath,
    repoPath,
    policies: {
      mustIds: applied.mustIds,
      count: bundle.rules.length,
      missingCoreMustIds:
        missingCoreMustIds.length > 0 ? [...missingCoreMustIds] : undefined,
    },
    decisions: {
      path: listed.path,
      count: listed.decisions.length,
      recent: listed.decisions,
      failCount: failDecisions.length,
      unknownPolicyIds:
        unknownPolicyIds.size > 0 ? [...unknownPolicyIds] : undefined,
    },
    documentation,
    findings,
    ok,
  }
}
