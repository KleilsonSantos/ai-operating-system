/**
 * Policy Engine — regras fixas da plataforma (substituem prompts longos).
 * Fase 1: defaults embutidos + carga JSON opcional + injeção no workflow.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { PolicyRule } from '@aios/shared'

export type PolicyBundle = {
  rules: PolicyRule[]
  /** Origem efetiva após merge */
  source: 'defaults' | 'file' | 'merged'
  /** Caminho do arquivo quando carregado de disco */
  path?: string
}

export type AppliedPolicies = {
  rules: PolicyRule[]
  /** Texto curto para injetar em agents / prompts */
  constraints: string
  /** IDs com severity `must` (audit / quality gate) */
  mustIds: string[]
}

export type LoadPoliciesOptions = {
  /** Caminho explícito do JSON de policies */
  configPath?: string
  /** cwd para resolução relativa (default: process.cwd()) */
  cwd?: string
  /** Se false, não faz merge com defaults — só o arquivo (default: true) */
  mergeDefaults?: boolean
}

/** Policies canônicas da pedra base / overview (Fase 1). */
export const DEFAULT_POLICIES: PolicyRule[] = [
  {
    id: 'official-docs',
    description: 'Sempre consultar documentação oficial',
    severity: 'must',
  },
  {
    id: 'trade-offs',
    description: 'Sempre indicar trade-offs',
    severity: 'must',
  },
  {
    id: 'no-overengineering',
    description: 'Sempre evitar overengineering',
    severity: 'must',
  },
  {
    id: 'justify-decisions',
    description: 'Sempre justificar decisões',
    severity: 'must',
  },
  {
    id: 'no-abandoned-libs',
    description: 'Nunca usar biblioteca abandonada',
    severity: 'must',
  },
]

/** @deprecated use DEFAULT_POLICIES */
export const defaultPolicies = DEFAULT_POLICIES

const SEVERITIES = new Set(['must', 'should', 'may'])

function assertRule(raw: unknown, index: number): PolicyRule {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`policy[${index}]: expected object`)
  }
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id.trim()) {
    throw new Error(`policy[${index}]: id required`)
  }
  if (typeof r.description !== 'string' || !r.description.trim()) {
    throw new Error(`policy[${index}]: description required`)
  }
  if (typeof r.severity !== 'string' || !SEVERITIES.has(r.severity)) {
    throw new Error(`policy[${index}]: severity must be must|should|may`)
  }
  return {
    id: r.id.trim(),
    description: r.description.trim(),
    severity: r.severity as PolicyRule['severity'],
  }
}

function parsePolicyFile(contents: string): PolicyRule[] {
  let data: unknown
  try {
    data = JSON.parse(contents)
  } catch {
    throw new Error('invalid JSON in policy config')
  }

  const list = Array.isArray(data)
    ? data
    : data &&
        typeof data === 'object' &&
        Array.isArray((data as { policies?: unknown }).policies)
      ? (data as { policies: unknown[] }).policies
      : null

  if (!list) {
    throw new Error('policy config must be an array or { "policies": [...] }')
  }

  return list.map((item, i) => assertRule(item, i))
}

/**
 * Merge por `id`: overlay substitui base; ids novos são acrescentados.
 * Ordem: base residual + overlay (overlay ganha prioridade de ordem no fim).
 */
export function mergePolicies(
  base: PolicyRule[],
  overlay: PolicyRule[],
): PolicyRule[] {
  const map = new Map<string, PolicyRule>()
  for (const rule of base) map.set(rule.id, rule)
  for (const rule of overlay) map.set(rule.id, rule)
  const overlayIds = new Set(overlay.map((r) => r.id))
  const fromBase = base.filter((r) => !overlayIds.has(r.id))
  return [...fromBase, ...overlay]
}

/** Sobe diretórios até achar `policies/aios.policies.json` (monorepo-friendly). */
function findPolicyFileUpwards(start: string): string | undefined {
  let dir = resolve(start)
  for (;;) {
    const candidate = join(dir, 'policies', 'aios.policies.json')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

function resolveConfigPath(options: LoadPoliciesOptions): string | undefined {
  if (options.configPath) {
    return resolve(options.cwd ?? process.cwd(), options.configPath)
  }
  if (process.env.AIOS_POLICIES_PATH) {
    return resolve(process.env.AIOS_POLICIES_PATH)
  }
  return findPolicyFileUpwards(options.cwd ?? process.cwd())
}

/**
 * Carrega policies: defaults embutidos + JSON opcional
 * (`configPath` | `AIOS_POLICIES_PATH` | `policies/aios.policies.json`).
 */
export function loadPolicies(options: LoadPoliciesOptions = {}): PolicyBundle {
  const mergeDefaults = options.mergeDefaults !== false
  const path = resolveConfigPath(options)

  if (!path) {
    return { rules: [...DEFAULT_POLICIES], source: 'defaults' }
  }

  if (!existsSync(path)) {
    throw new Error(`policy config not found: ${path}`)
  }

  const fromFile = parsePolicyFile(readFileSync(path, 'utf8'))

  if (!mergeDefaults) {
    return { rules: fromFile, source: 'file', path }
  }

  return {
    rules: mergePolicies(DEFAULT_POLICIES, fromFile),
    source: 'merged',
    path,
  }
}

/**
 * Formata rules como bloco de constraints para agents (policies > prompts).
 */
export function formatConstraints(rules: PolicyRule[]): string {
  if (rules.length === 0) return ''
  const lines = rules.map((r) => `- [${r.severity}] ${r.id}: ${r.description}`)
  return ['AIOS policies (obrigatórias no workflow):', ...lines].join('\n')
}

/**
 * Prepara policies para injeção no workflow / quality gate.
 */
export function applyPolicies(rules: PolicyRule[]): AppliedPolicies {
  const enabled = rules.filter(Boolean)
  return {
    rules: enabled,
    constraints: formatConstraints(enabled),
    mustIds: enabled.filter((r) => r.severity === 'must').map((r) => r.id),
  }
}
