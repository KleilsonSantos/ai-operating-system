/**
 * @aios/mcp — MCP stdio server (Cursor Agent ↔ AIOS pipeline).
 * Issue #38 · Nível 2 da ponte chat.
 *
 * stdout = JSON-RPC MCP — use console.error for logs.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { runPipeline, PIPELINE_CONTRACT_VERSION } from '@aios/pipeline'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { resolve } from 'node:path'

const server = new McpServer({
  name: 'aios',
  version: '0.6.0',
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
      policiesPath: z
        .string()
        .optional()
        .describe('Optional path to policies JSON'),
    },
  },
  async ({ repoPath, policiesPath }) => {
    const cwd = resolve(repoPath || process.env.AIOS_REPO || process.cwd())
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
      'Runs the Fase 1 nucleus: intent → policies → context → agents → quality gate. Prefer short user intents; policies are loaded by the engine. Returns PipelineResponse JSON (contractVersion 1).',
    inputSchema: {
      input: z
        .string()
        .describe('Short user intent, e.g. "Analise meu projeto."'),
      repoPath: z
        .string()
        .optional()
        .describe('Target repository root (default cwd / AIOS_REPO)'),
      scope: z
        .string()
        .optional()
        .describe('Context scope relative to repo (e.g. engines/policy)'),
      policiesPath: z.string().optional().describe('Optional policies JSON path'),
    },
  },
  async ({ input, repoPath, scope, policiesPath }) => {
    try {
      const response = await runPipeline({
        input,
        repoPath: repoPath || process.env.AIOS_REPO,
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
