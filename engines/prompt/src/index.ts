/**
 * Prompt Engine — intent curto → brief governado (economia de tokens · #59).
 * Não chama LLM; só monta texto/estrutura para o Agent da IDE consumir.
 */
import { resolve } from 'node:path'
import { resolveIntent } from '@aios/intent'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { resolveWorkspace } from '@aios/workspace'
import { buildKnowledgeGraph, summarizeKnowledge } from '@aios/knowledge'
import { recall } from '@aios/memory'
import type {
  CompiledPrompt,
  CompilePromptRequest,
  Intent,
} from '@aios/shared'

export type { CompiledPrompt, CompilePromptRequest }

function resolveRepo(request: CompilePromptRequest): {
  repoPath: string
  workspaceId?: string
} {
  if (request.repoPath) {
    return {
      repoPath: resolve(request.repoPath),
      workspaceId: request.workspaceId,
    }
  }
  const ws = resolveWorkspace(request.workspaceId, {
    cwd: process.env.AIOS_HOME || process.cwd(),
  })
  if (ws) {
    return { repoPath: ws.repoPath, workspaceId: ws.entry.id }
  }
  return {
    repoPath: resolve(process.cwd()),
    workspaceId: request.workspaceId,
  }
}

function formatBrief(parts: {
  input: string
  intent: Intent
  mustIds: string[]
  constraints: string
  memoryLines: string[]
  knowledge: { nodeCount: number; edgeCount: number; kinds: Record<string, number> }
  workspaceId?: string
  repoPath: string
}): string {
  const lines: string[] = [
    '# AIOS brief (não repetir estas regras no chat)',
    '',
    `## Pedido`,
    parts.input.trim(),
    '',
    `## Intent`,
    `- kind: \`${parts.intent.kind}\` (confidence ${parts.intent.confidence})`,
    '',
    `## Contexto`,
    `- repo: \`${parts.repoPath}\``,
  ]
  if (parts.workspaceId) {
    lines.push(`- workspace: \`${parts.workspaceId}\``)
  }
  lines.push(
    `- knowledge: ${parts.knowledge.nodeCount} nós / ${parts.knowledge.edgeCount} arestas (${Object.entries(
      parts.knowledge.kinds,
    )
      .map(([k, n]) => `${k}:${n}`)
      .join(', ') || '—'})`,
    '',
    `## Policies (must)`,
    ...parts.mustIds.map((id) => `- ${id}`),
    '',
    `## Constraints`,
    parts.constraints,
    '',
  )
  if (parts.memoryLines.length) {
    lines.push(`## Memory (workspace)`, ...parts.memoryLines.map((m) => `- ${m}`), '')
  }
  lines.push(
    `## Instruções ao Agent`,
    `- Cumprir policies acima sem pedir ao usuário para reescrevê-las.`,
    `- Preferir mudança mínima; citar trade-offs se decisão não óbvia.`,
    `- Fluxo Git: feature/* → sandbox → main.`,
    '',
  )
  return lines.join('\n')
}

/**
 * Compila um brief compacto para colar no Agent (ou consumir via MCP).
 */
export function compilePrompt(
  request: CompilePromptRequest,
): CompiledPrompt {
  const input = request.input?.trim() || 'Analise meu projeto.'
  const { repoPath, workspaceId } = resolveRepo(request)
  const intent = resolveIntent(input)

  const policyBundle = loadPolicies({
    cwd: repoPath,
    configPath: request.policiesPath,
  })
  const applied = applyPolicies(policyBundle.rules)
  const knowledge = summarizeKnowledge(buildKnowledgeGraph({ repoPath }))

  let memoryLines: string[] = []
  let memoryCount = 0
  if (workspaceId) {
    const mem = recall(workspaceId, {
      homePath: process.env.AIOS_HOME || process.cwd(),
      limit: request.memoryLimit ?? 5,
    })
    memoryCount = mem.entries.length
    memoryLines = mem.entries.map((e) => {
      const tags = e.tags?.length ? ` [${e.tags.join(',')}]` : ''
      return `${e.content.slice(0, 240)}${tags}`
    })
  }

  const brief = formatBrief({
    input,
    intent,
    mustIds: applied.mustIds,
    constraints: applied.constraints,
    memoryLines,
    knowledge: {
      nodeCount: knowledge.nodeCount,
      edgeCount: knowledge.edgeCount,
      kinds: knowledge.kinds,
    },
    workspaceId,
    repoPath,
  })

  return {
    input,
    intent,
    workspaceId,
    repoPath,
    brief,
    stats: {
      mustPolicyCount: applied.mustIds.length,
      memoryCount,
      knowledgeNodes: knowledge.nodeCount,
      briefChars: brief.length,
    },
  }
}
