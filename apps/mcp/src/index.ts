/**
 * @aios/mcp — MCP stdio server (Cursor Agent ↔ AIOS pipeline).
 * Issue #38 · #43 (workspaces)
 *
 * stdout = JSON-RPC MCP — use console.error for logs.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { runPipeline, PIPELINE_CONTRACT_VERSION } from '@aios/pipeline'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { loadWorkspaces, resolveWorkspace } from '@aios/workspace'
import { buildKnowledgeGraph, summarizeKnowledge } from '@aios/knowledge'
import { remember, recall, clearMemory, listMemoryWorkspaces } from '@aios/memory'
import { resolve } from 'node:path'

const server = new McpServer({
  name: 'aios',
  version: '0.10.0',
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
