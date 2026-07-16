/**
 * Operational State Engine — snapshot unificado leve (#84 / ADR-0015).
 * On-demand only (Resource-Aware). Sem voz, sem controlar IDE/Docker.
 */
import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import type {
  OperationalGitSnapshot,
  OperationalState,
} from '@aios/shared'
import { getGovernanceStatus } from '@aios/status'
import { resolveWorkspace } from '@aios/workspace'
import { listDecisions } from '@aios/governance'

export type GetOperationalStateOptions = {
  homePath?: string
  /** Workspace em foco (registry); afeta git cwd e focus. */
  workspaceId?: string
  providerId?: string
  /** Skip live provider (tests) */
  providerHealth?: Awaited<
    ReturnType<typeof getGovernanceStatus>
  >['provider']
}

function resolveHome(homePath?: string): string {
  return resolve(homePath || process.env.AIOS_HOME || process.cwd())
}

function stateEventsPath(homePath: string): string {
  return join(homePath, '.aios', 'state', 'events.jsonl')
}

/** Git leve — uma chamada sync curta; falha → available:false (não é erro de produto). */
export function probeGit(cwd: string): OperationalGitSnapshot {
  try {
    const opts = {
      cwd,
      encoding: 'utf8' as const,
      timeout: 2000,
      stdio: ['ignore', 'pipe', 'pipe'] as ['ignore', 'pipe', 'pipe'],
    }
    const inside = execFileSync(
      'git',
      ['rev-parse', '--is-inside-work-tree'],
      opts,
    ).trim()
    if (inside !== 'true') {
      return { available: false, error: 'not a git work tree' }
    }
    const branch = execFileSync(
      'git',
      ['rev-parse', '--abbrev-ref', 'HEAD'],
      opts,
    ).trim()
    const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], opts).trim()
    let dirty = false
    try {
      const porcelain = execFileSync('git', ['status', '--porcelain'], opts)
      dirty = porcelain.trim().length > 0
    } catch {
      /* dirty optional */
    }
    return { available: true, branch, head, dirty }
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

function buildSummary(parts: {
  workspaceCount: number
  errorCount: number
  warnCount: number
  branch?: string
  decisionCount: number
}): string {
  const bits: string[] = []
  bits.push(
    parts.workspaceCount === 0
      ? 'sem workspaces'
      : `${parts.workspaceCount} workspace(s)`,
  )
  if (parts.branch) bits.push(`git:${parts.branch}`)
  if (parts.errorCount > 0) bits.push(`${parts.errorCount} error(s)`)
  else if (parts.warnCount > 0) bits.push(`${parts.warnCount} warn(s)`)
  else bits.push('healthy')
  bits.push(`${parts.decisionCount} decisão(ões)`)
  return bits.join(' · ')
}

/**
 * Snapshot unificado do control plane para MCP/CLI/console/Companion.
 */
export async function getOperationalState(
  options: GetOperationalStateOptions = {},
): Promise<OperationalState> {
  const homePath = resolveHome(options.homePath)
  const status = await getGovernanceStatus({
    homePath,
    providerId: options.providerId,
    providerHealth: options.providerHealth,
  })

  const focusId = options.workspaceId
  let focus: OperationalState['focus']
  let gitCwd = homePath

  if (focusId) {
    const ws = resolveWorkspace(focusId, { cwd: homePath })
    if (ws) {
      const validated = status.workspaces.find((w) => w.id === ws.entry.id)
      focus = {
        workspaceId: ws.entry.id,
        name: ws.entry.name,
        repoPath: ws.repoPath,
        ok: validated?.ok ?? true,
      }
      gitCwd = ws.repoPath
    }
  } else if (status.workspaces.length === 1) {
    const w = status.workspaces[0]!
    focus = {
      workspaceId: w.id,
      name: w.name,
      repoPath: w.repoPath,
      ok: w.ok,
    }
    gitCwd = w.repoPath
  }

  const git = probeGit(gitCwd)
  const listed = listDecisions({ homePath, limit: 10_000 })
  const decisionCount = listed.decisions.length
  const errorCount = status.attention.filter((a) => a.severity === 'error').length
  const warnCount = status.attention.filter((a) => a.severity === 'warn').length

  return {
    generatedAt: new Date().toISOString(),
    contractVersion: status.contractVersion,
    homePath,
    mode: 'on-demand',
    summary: buildSummary({
      workspaceCount: status.workspaces.length,
      errorCount,
      warnCount,
      branch: git.branch,
      decisionCount,
    }),
    git,
    focus,
    health: {
      attention: status.attention,
      errorCount,
      warnCount,
      providerOk: status.provider.ok,
      workspaceCount: status.workspaces.length,
      policiesMust: status.policies.mustIds.length,
    },
    memory: {
      workspaceIds: status.memory.workspaceIds,
    },
    governance: {
      decisionCount,
      path: listed.path,
    },
    boundaries: {
      voice: false,
      ideControl: false,
      dockerControl: false,
    },
  }
}

/**
 * Event hook barato Resource-Aware — append JSONL on-demand (sem watcher/poll).
 */
export function recordOperationalEvent(
  event: Record<string, unknown>,
  options: { homePath?: string } = {},
): string {
  const home = resolveHome(options.homePath)
  const file = stateEventsPath(home)
  mkdirSync(join(home, '.aios', 'state'), { recursive: true })
  const line = JSON.stringify({
    ...event,
    at: event.at || new Date().toISOString(),
  })
  appendFileSync(file, `${line}\n`, 'utf8')
  return file
}

export function operationalEventsPath(homePath?: string): string {
  return stateEventsPath(resolveHome(homePath))
}

export function hasOperationalEvents(homePath?: string): boolean {
  return existsSync(operationalEventsPath(homePath))
}
