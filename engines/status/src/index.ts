/**
 * Status Engine — visão de saúde + “needs attention” para o console (#71).
 * Não é Grafana; agrega estado determinístico dos engines. Métricas de consumo = stub.
 */
import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  PIPELINE_CONTRACT_VERSION,
  type AttentionItem,
  type GovernanceStatus,
} from '@aios/shared'
import { listValidatedWorkspaces } from '@aios/workspace'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { listMemoryWorkspaces } from '@aios/memory'
import { getProvider, listProviderIds } from '@aios/provider'

/** Tools expostas pelo `@aios/mcp` (lista canónica do MVP). */
export const MCP_TOOL_CATALOG = [
  'aios_contract_version',
  'aios_compile_prompt',
  'aios_list_workspaces',
  'aios_workspace_upsert',
  'aios_workspace_remove',
  'aios_workspace_validate',
  'aios_run_across_workspaces',
  'aios_build_knowledge',
  'aios_memory_remember',
  'aios_memory_recall',
  'aios_memory_clear',
  'aios_load_policies',
  'aios_run_pipeline',
  'aios_provider_health',
  'aios_provider_models',
  'aios_provider_chat',
  'aios_governance_status',
] as const

export type GetGovernanceStatusOptions = {
  homePath?: string
  providerId?: string
  /** Skip live provider check (tests) */
  providerHealth?: GovernanceStatus['provider']
}

function metricsPath(homePath: string): string {
  return join(homePath, '.aios', 'metrics', 'events.jsonl')
}

function countMetricEvents(homePath: string): {
  eventCount: number
  path: string
} {
  const path = metricsPath(homePath)
  if (!existsSync(path)) return { eventCount: 0, path }
  try {
    const raw = readFileSync(path, 'utf8')
    const lines = raw.split('\n').filter((l) => l.trim())
    return { eventCount: lines.length, path }
  } catch {
    return { eventCount: 0, path }
  }
}

/** Gancho futuro Grafana/Prometheus — append JSONL local. */
export function recordMetricEvent(
  event: Record<string, unknown>,
  options: { homePath?: string } = {},
): string {
  const home = resolve(options.homePath || process.env.AIOS_HOME || process.cwd())
  const file = metricsPath(home)
  mkdirSync(join(home, '.aios', 'metrics'), { recursive: true })
  const line = JSON.stringify({
    ...event,
    at: event.at || new Date().toISOString(),
  })
  appendFileSync(file, `${line}\n`, 'utf8')
  return file
}

function buildAttention(parts: {
  workspaces: GovernanceStatus['workspaces']
  policies: GovernanceStatus['policies']
  provider: GovernanceStatus['provider']
  memoryIds: string[]
  metricsAvailable: boolean
}): AttentionItem[] {
  const items: AttentionItem[] = []

  if (!parts.provider.ok) {
    items.push({
      id: 'provider-down',
      severity: 'warn',
      title: `Provider ${parts.provider.provider} inativo (opcional)`,
      detail:
        parts.provider.error ||
        `Sem resposta em ${parts.provider.baseUrl}. Auxiliar local — não instalar só para o console ficar verde (resource-aware). IDE/MCP AIOS continuam ok.`,
    })
  }

  if (parts.workspaces.length === 0) {
    items.push({
      id: 'no-workspaces',
      severity: 'warn',
      title: 'Nenhum workspace registado',
      detail: 'Cria entradas em workspaces/aios.workspaces.json.',
    })
  }

  for (const w of parts.workspaces) {
    if (!w.ok) {
      items.push({
        id: `workspace-bad-${w.id}`,
        severity: 'error',
        title: `Workspace \`${w.id}\` inválido`,
        detail: w.signals.join('; ') || w.repoPath,
      })
    }
  }

  if (parts.policies.mustIds.length === 0) {
    items.push({
      id: 'no-must-policies',
      severity: 'warn',
      title: 'Sem policies must',
      detail: 'Carrega policies/aios.policies.json ou defaults da plataforma.',
    })
  }

  const registered = new Set(parts.workspaces.map((w) => w.id))
  const withMemory = parts.memoryIds.filter((id) => registered.has(id))
  if (parts.workspaces.length > 0 && withMemory.length === 0) {
    items.push({
      id: 'no-memory',
      severity: 'info',
      title: 'Memória vazia nos workspaces',
      detail: 'Nada em .aios/memory — normal em ambiente fresco.',
    })
  }

  if (!parts.metricsAvailable) {
    items.push({
      id: 'metrics-stub',
      severity: 'info',
      title: 'Consumo (tokens) ainda não instrumentado',
      detail:
        'Gancho .aios/metrics/events.jsonl existe; Grafana / séries temporais vêm depois.',
    })
  }

  const rank = { error: 0, warn: 1, info: 2 } as const
  return items.sort((a, b) => rank[a.severity] - rank[b.severity])
}

export async function getGovernanceStatus(
  options: GetGovernanceStatusOptions = {},
): Promise<GovernanceStatus> {
  const homePath = resolve(
    options.homePath || process.env.AIOS_HOME || process.cwd(),
  )

  const validated = listValidatedWorkspaces({ cwd: homePath })
  const workspaces = validated.map((w) => ({
    id: w.id,
    name: w.name,
    repoPath: w.repoPath,
    ok: w.validation.ok,
    signals: w.validation.signals,
  }))

  const bundle = loadPolicies({ cwd: homePath })
  const applied = applyPolicies(bundle.rules)
  const policies = {
    source: bundle.source,
    path: bundle.path,
    count: bundle.rules.length,
    mustIds: applied.mustIds,
  }

  const provider =
    options.providerHealth ||
    (await getProvider(options.providerId || 'ollama').health())

  const memoryIds = listMemoryWorkspaces({ homePath })
  const metrics = countMetricEvents(homePath)
  const metricsAvailable = metrics.eventCount > 0

  const attention = buildAttention({
    workspaces,
    policies,
    provider,
    memoryIds,
    metricsAvailable,
  })

  return {
    generatedAt: new Date().toISOString(),
    contractVersion: PIPELINE_CONTRACT_VERSION,
    homePath,
    workspaces,
    policies,
    provider,
    memory: { workspaceIds: memoryIds },
    exposed: {
      mcpTools: [...MCP_TOOL_CATALOG],
      providers: listProviderIds(),
    },
    attention,
    metrics: {
      available: metricsAvailable,
      note: metricsAvailable
        ? 'Eventos locais em JSONL (ainda sem export Prometheus).'
        : 'Stub — use recordMetricEvent() ou instrumentação futura para Grafana.',
      eventCount: metrics.eventCount,
      path: metrics.path,
    },
  }
}
