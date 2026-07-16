/**
 * @aios/mcp — MCP stdio server (Cursor Agent ↔ AIOS pipeline).
 * Issue #38 · #43 (workspaces)
 *
 * stdout = JSON-RPC MCP — use console.error for logs.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { runPipeline, runAcrossWorkspaces, PIPELINE_CONTRACT_VERSION } from '@aios/pipeline'
import { loadPolicies, applyPolicies } from '@aios/policy'
import {
  loadWorkspaces,
  resolveWorkspace,
  upsertWorkspace,
  removeWorkspace,
  validateWorkspace,
  listValidatedWorkspaces,
} from '@aios/workspace'
import { buildKnowledgeGraph, summarizeKnowledge } from '@aios/knowledge'
import { remember, recall, clearMemory, listMemoryWorkspaces } from '@aios/memory'
import { compilePrompt } from '@aios/prompt'
import { getProvider, listProviderIds } from '@aios/provider'
import { getGovernanceStatus } from '@aios/status'
import { auditDocumentation } from '@aios/documentation'
import { auditGovernance, recordDecision } from '@aios/governance'
import { resolve } from 'node:path'

const server = new McpServer({
  name: 'aios',
  version: '0.16.0',
})

server.registerTool(
  'aios_contract_version',
  {
    title: 'AIOS contract version',
    description:
      'Returns the stable Pipeline contractVersion used by @aios/pipeline / CLI.',
  },
  async () => ({
    content: [
      {
        type: 'text',
        text: JSON.stringify({ contractVersion: PIPELINE_CONTRACT_VERSION }),
      },
    ],
  }),
)

server.registerTool(
  'aios_compile_prompt',
  {
    title: 'Compile AIOS brief',
    description:
      'Turns a short user intent into a governed markdown brief (policies + memory + KG). Use this instead of pasting long sermons into chat — saves tokens (#59).',
    inputSchema: {
      input: z.string().describe('Short intent, e.g. "Crie um hook de auth"'),
      workspaceId: z.string().optional(),
      repoPath: z.string().optional(),
      memoryLimit: z.number().optional(),
    },
  },
  async ({ input, workspaceId, repoPath, memoryLimit }) => {
    try {
      const compiled = compilePrompt({
        input,
        workspaceId: workspaceId || process.env.AIOS_WORKSPACE,
        repoPath: repoPath || process.env.AIOS_REPO,
        memoryLimit,
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                stats: compiled.stats,
                intent: compiled.intent,
                workspaceId: compiled.workspaceId,
                repoPath: compiled.repoPath,
                brief: compiled.brief,
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [{ type: 'text', text: `aios_compile_prompt failed: ${message}` }],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_list_workspaces',
  {
    title: 'List AIOS workspaces',
    description:
      'Lists registered multi-repo workspaces from workspaces/aios.workspaces.json (Fase 2).',
    inputSchema: {
      homePath: z
        .string()
        .optional()
        .describe('AIOS home / search root (default: AIOS_HOME / cwd)'),
      workspacesPath: z
        .string()
        .optional()
        .describe('Override path to aios.workspaces.json'),
    },
  },
  async ({ homePath, workspacesPath }) => {
    const cwd = resolve(
      homePath || process.env.AIOS_HOME || process.cwd(),
    )
    const bundle = loadWorkspaces({
      cwd,
      configPath: workspacesPath || process.env.AIOS_WORKSPACES_PATH,
    })
    const listed = bundle.workspaces.map((w) => {
      const resolved = resolveWorkspace(w.id, {
        cwd,
        configPath: bundle.path,
      })
      return {
        id: w.id,
        name: w.name,
        path: w.path,
        default: Boolean(w.default),
        tags: w.tags,
        repoPath: resolved?.repoPath,
      }
    })
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              source: bundle.source,
              path: bundle.path,
              count: listed.length,
              workspaces: listed,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
)

server.registerTool(
  'aios_workspace_upsert',
  {
    title: 'Upsert workspace',
    description:
      'Register or update a workspace in workspaces/aios.workspaces.json (multi-repo genérico · #55).',
    inputSchema: {
      id: z.string().describe('Stable workspace id'),
      path: z.string().describe('Absolute or relative path to the repo'),
      name: z.string().optional(),
      tags: z.array(z.string()).optional(),
      makeDefault: z.boolean().optional(),
      homePath: z.string().optional(),
    },
  },
  async ({ id, path, name, tags, makeDefault, homePath }) => {
    const result = upsertWorkspace(
      { id, path, name, tags, makeDefault },
      { cwd: homePath || process.env.AIOS_HOME || process.cwd() },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  },
)

server.registerTool(
  'aios_workspace_remove',
  {
    title: 'Remove workspace',
    description: 'Remove a workspace id from the registry (#55).',
    inputSchema: {
      id: z.string(),
      homePath: z.string().optional(),
    },
  },
  async ({ id, homePath }) => {
    const result = removeWorkspace(id, {
      cwd: homePath || process.env.AIOS_HOME || process.cwd(),
    })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  },
)

server.registerTool(
  'aios_workspace_validate',
  {
    title: 'Validate workspace(s)',
    description:
      'Checks that registered workspace paths look like usable repos (#55). Omit id to validate all.',
    inputSchema: {
      id: z.string().optional().describe('Single workspace id; omit = all'),
      homePath: z.string().optional(),
    },
  },
  async ({ id, homePath }) => {
    const cwd = homePath || process.env.AIOS_HOME || process.cwd()
    if (id) {
      const v = validateWorkspace(id, { cwd })
      return {
        content: [{ type: 'text', text: JSON.stringify(v, null, 2) }],
      }
    }
    const all = listValidatedWorkspaces({ cwd })
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              count: all.length,
              workspaces: all.map((w) => ({
                id: w.id,
                repoPath: w.repoPath,
                ok: w.validation.ok,
                signals: w.validation.signals,
              })),
            },
            null,
            2,
          ),
        },
      ],
    }
  },
)

server.registerTool(
  'aios_run_across_workspaces',
  {
    title: 'Run pipeline across workspaces',
    description:
      'Runs runPipeline for each registered workspace (or a subset). Multi-repo genérico (#55).',
    inputSchema: {
      input: z.string().describe('Short user intent'),
      workspaceIds: z
        .array(z.string())
        .optional()
        .describe('Subset of ids; default = all'),
      homePath: z.string().optional(),
      scope: z.string().optional(),
    },
  },
  async ({ input, workspaceIds, homePath, scope }) => {
    try {
      const result = await runAcrossWorkspaces({
        input,
        workspaceIds,
        homePath: homePath || process.env.AIOS_HOME || process.cwd(),
        scope,
      })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        isError: result.results.some((r) => !r.verdictPassed || r.error),
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [
          { type: 'text', text: `aios_run_across_workspaces failed: ${message}` },
        ],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_build_knowledge',
  {
    title: 'Build AIOS knowledge graph',
    description:
      'Builds a heuristic Knowledge Graph for a repo (project → packages/engines → docs → infra). No embeddings. Fase 2 · #47.',
    inputSchema: {
      repoPath: z
        .string()
        .optional()
        .describe('Repo root (default: AIOS_REPO / cwd)'),
      workspaceId: z
        .string()
        .optional()
        .describe('Workspace id (resolves repoPath)'),
      full: z
        .boolean()
        .optional()
        .describe('If true, return full nodes/edges; else summary only'),
    },
  },
  async ({ repoPath, workspaceId, full }) => {
    let root = resolve(repoPath || process.env.AIOS_REPO || process.cwd())
    if (!repoPath && workspaceId) {
      const ws = resolveWorkspace(workspaceId, {
        cwd: process.env.AIOS_HOME || process.cwd(),
      })
      if (ws) root = ws.repoPath
    }
    const graph = buildKnowledgeGraph({ repoPath: root })
    const payload = full
      ? graph
      : { ...summarizeKnowledge(graph), repoPath: graph.repoPath }
    return {
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    }
  },
)

server.registerTool(
  'aios_memory_remember',
  {
    title: 'Remember for workspace',
    description:
      'Persists a short session/project fact under .aios/memory/{workspaceId}.json (Fase 2 · #51).',
    inputSchema: {
      workspaceId: z
        .string()
        .describe('Workspace id (e.g. aios)'),
      content: z.string().describe('Fact / note to remember'),
      tags: z.array(z.string()).optional().describe('Optional tags'),
    },
  },
  async ({ workspaceId, content, tags }) => {
    try {
      const entry = remember(workspaceId, content, {
        homePath: process.env.AIOS_HOME || process.cwd(),
        tags,
      })
      return {
        content: [{ type: 'text', text: JSON.stringify({ ok: true, entry }, null, 2) }],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [{ type: 'text', text: `aios_memory_remember failed: ${message}` }],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_memory_recall',
  {
    title: 'Recall workspace memory',
    description: 'Reads recent memory entries for a workspace (#51).',
    inputSchema: {
      workspaceId: z.string().describe('Workspace id'),
      limit: z.number().optional().describe('Max entries (default 10)'),
      query: z.string().optional().describe('Substring filter'),
      tag: z.string().optional().describe('Tag filter'),
    },
  },
  async ({ workspaceId, limit, query, tag }) => {
    const result = recall(workspaceId, {
      homePath: process.env.AIOS_HOME || process.cwd(),
      limit,
      query,
      tag,
    })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  },
)

server.registerTool(
  'aios_memory_clear',
  {
    title: 'Clear workspace memory',
    description: 'Deletes the memory file for a workspace (#51).',
    inputSchema: {
      workspaceId: z.string().describe('Workspace id'),
    },
  },
  async ({ workspaceId }) => {
    const cleared = clearMemory(workspaceId, {
      homePath: process.env.AIOS_HOME || process.cwd(),
    })
    const remaining = listMemoryWorkspaces({
      homePath: process.env.AIOS_HOME || process.cwd(),
    })
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ cleared, workspaceId, remaining }, null, 2),
        },
      ],
    }
  },
)

server.registerTool(
  'aios_load_policies',
  {
    title: 'Load AIOS policies',
    description:
      'Loads platform policies (defaults + policies/aios.policies.json). Use before coding/reviews so rules are explicit.',
    inputSchema: {
      repoPath: z
        .string()
        .optional()
        .describe('Repo root (default: process.cwd() / AIOS_REPO)'),
      workspaceId: z
        .string()
        .optional()
        .describe('Workspace id from registry (resolves repoPath)'),
      policiesPath: z
        .string()
        .optional()
        .describe('Optional path to policies JSON'),
    },
  },
  async ({ repoPath, workspaceId, policiesPath }) => {
    let cwd = resolve(repoPath || process.env.AIOS_REPO || process.cwd())
    if (!repoPath && workspaceId) {
      const ws = resolveWorkspace(workspaceId, {
        cwd: process.env.AIOS_HOME || process.cwd(),
      })
      if (ws) cwd = ws.repoPath
    }
    const bundle = loadPolicies({
      cwd,
      configPath: policiesPath || process.env.AIOS_POLICIES_PATH,
    })
    const applied = applyPolicies(bundle.rules)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              source: bundle.source,
              path: bundle.path,
              count: bundle.rules.length,
              mustIds: applied.mustIds,
              constraints: applied.constraints,
              rules: bundle.rules,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
)

server.registerTool(
  'aios_governance_status',
  {
    title: 'Governance status',
    description:
      'Health + Needs attention for the AIOS console (#71): workspaces, policies, provider, MCP catalog. Not a Grafana metrics dump.',
    inputSchema: {
      homePath: z.string().optional(),
      provider: z.string().optional().describe('Provider id for health check'),
    },
  },
  async ({ homePath, provider }) => {
    try {
      const status = await getGovernanceStatus({
        homePath: homePath || process.env.AIOS_HOME || process.cwd(),
        providerId: provider,
      })
      return {
        content: [{ type: 'text', text: JSON.stringify(status, null, 2) }],
        isError: status.attention.some((a) => a.severity === 'error'),
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [
          { type: 'text', text: `aios_governance_status failed: ${message}` },
        ],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_audit_docs',
  {
    title: 'Audit documentation',
    description:
      'Heuristic documentation inventory/drift (canonical paths, ADRs, policies). Documentation Engine (#80).',
    inputSchema: {
      repoPath: z.string().optional(),
      workspaceId: z.string().optional(),
    },
  },
  async ({ repoPath, workspaceId }) => {
    try {
      let root = resolve(repoPath || process.env.AIOS_REPO || process.cwd())
      if (!repoPath && workspaceId) {
        const ws = resolveWorkspace(workspaceId, {
          cwd: process.env.AIOS_HOME || process.cwd(),
        })
        if (ws) root = ws.repoPath
      }
      const audit = auditDocumentation({ repoPath: root })
      return {
        content: [{ type: 'text', text: JSON.stringify(audit, null, 2) }],
        isError: !audit.ok,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [{ type: 'text', text: `aios_audit_docs failed: ${message}` }],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_governance_audit',
  {
    title: 'Governance audit',
    description:
      'Light governance audit: must policies + decision log + optional docs drift (#80).',
    inputSchema: {
      homePath: z.string().optional(),
      repoPath: z.string().optional(),
      includeDocumentation: z.boolean().optional(),
    },
  },
  async ({ homePath, repoPath, includeDocumentation }) => {
    try {
      const audit = auditGovernance({
        homePath: homePath || process.env.AIOS_HOME || process.cwd(),
        repoPath: repoPath || process.env.AIOS_REPO,
        includeDocumentation,
      })
      return {
        content: [{ type: 'text', text: JSON.stringify(audit, null, 2) }],
        isError: !audit.ok,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [
          { type: 'text', text: `aios_governance_audit failed: ${message}` },
        ],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_governance_record',
  {
    title: 'Record governance decision',
    description:
      'Append a light decision to .aios/governance/decisions.jsonl (#80).',
    inputSchema: {
      summary: z.string().describe('Short decision summary'),
      kind: z.string().optional().describe('e.g. policy, release, exception'),
      verdict: z.enum(['pass', 'fail', 'info']).optional(),
      policyIds: z.array(z.string()).optional(),
      homePath: z.string().optional(),
    },
  },
  async ({ summary, kind, verdict, policyIds, homePath }) => {
    try {
      const entry = recordDecision(
        {
          summary,
          kind: kind || 'note',
          verdict,
          policyIds,
          source: 'mcp',
        },
        { homePath: homePath || process.env.AIOS_HOME || process.cwd() },
      )
      return {
        content: [{ type: 'text', text: JSON.stringify({ ok: true, entry }, null, 2) }],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [
          { type: 'text', text: `aios_governance_record failed: ${message}` },
        ],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_provider_health',
  {
    title: 'Provider health',
    description:
      'Checks a local/aux LLM provider (default ollama). Does not replace the IDE model (#67).',
    inputSchema: {
      provider: z
        .string()
        .optional()
        .describe(`Provider id (default ollama). Available: ${listProviderIds().join(', ')}`),
      baseUrl: z
        .string()
        .optional()
        .describe('Override base URL (default AIOS_OLLAMA_URL / localhost:11434)'),
    },
  },
  async ({ provider, baseUrl }) => {
    try {
      const p = getProvider(provider || 'ollama', { baseUrl })
      const health = await p.health()
      return {
        content: [{ type: 'text', text: JSON.stringify(health, null, 2) }],
        isError: !health.ok,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [{ type: 'text', text: `aios_provider_health failed: ${message}` }],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_provider_models',
  {
    title: 'List provider models',
    description: 'Lists models from the provider (Ollama /api/tags) (#67).',
    inputSchema: {
      provider: z.string().optional(),
      baseUrl: z.string().optional(),
    },
  },
  async ({ provider, baseUrl }) => {
    try {
      const p = getProvider(provider || 'ollama', { baseUrl })
      const models = await p.models()
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { provider: p.id, count: models.length, models },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [{ type: 'text', text: `aios_provider_models failed: ${message}` }],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_provider_chat',
  {
    title: 'Provider chat (aux)',
    description:
      'Cheap/local chat via AIProvider (default Ollama). Use for drafts/summaries — coding stays in Cursor (#67).',
    inputSchema: {
      message: z.string().describe('User message'),
      provider: z.string().optional().describe('Provider id (default ollama)'),
      model: z.string().optional().describe('Model name (default AIOS_OLLAMA_MODEL)'),
      system: z.string().optional().describe('Optional system prompt'),
      baseUrl: z.string().optional(),
      temperature: z.number().optional(),
    },
  },
  async ({ message, provider, model, system, baseUrl, temperature }) => {
    try {
      const p = getProvider(provider || 'ollama', { baseUrl })
      const messages = [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        { role: 'user' as const, content: message },
      ]
      const out = await p.chat({ model, messages, temperature })
      return {
        content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      return {
        content: [{ type: 'text', text: `aios_provider_chat failed: ${errMsg}` }],
        isError: true,
      }
    }
  },
)

server.registerTool(
  'aios_run_pipeline',
  {
    title: 'Run AIOS pipeline',
    description:
      'Runs the nucleus: intent → policies → context → agents → quality gate. Prefer short user intents. Returns PipelineResponse JSON (contractVersion 1).',
    inputSchema: {
      input: z
        .string()
        .describe('Short user intent, e.g. "Analise meu projeto."'),
      repoPath: z
        .string()
        .optional()
        .describe('Target repository root (wins over workspaceId)'),
      workspaceId: z
        .string()
        .optional()
        .describe('Id from workspaces/aios.workspaces.json'),
      scope: z
        .string()
        .optional()
        .describe('Context scope relative to repo (e.g. engines/policy)'),
      policiesPath: z.string().optional().describe('Optional policies JSON path'),
    },
  },
  async ({ input, repoPath, workspaceId, scope, policiesPath }) => {
    try {
      const response = await runPipeline({
        input,
        repoPath: repoPath || process.env.AIOS_REPO,
        workspaceId: workspaceId || process.env.AIOS_WORKSPACE,
        scope: scope || process.env.AIOS_SCOPE,
        policiesPath: policiesPath || process.env.AIOS_POLICIES_PATH,
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
        isError: !response.verdict.passed,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [{ type: 'text', text: `aios_run_pipeline failed: ${message}` }],
        isError: true,
      }
    }
  },
)

async function main(): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('aios MCP server running on stdio (contract v1)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
