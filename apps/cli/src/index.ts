import { resolveIntent } from '@aios/intent'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { gatherContext } from '@aios/context'
import { runWorkflow } from '@aios/orchestration'
import { evaluateQuality } from '@aios/quality-gate'

function parseArgs(argv: string[]): { raw: string; scope?: string } {
  let scope: string | undefined
  const parts: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!
    if (a === '--scope') {
      scope = argv[++i]
      continue
    }
    if (a.startsWith('--scope=')) {
      scope = a.slice('--scope='.length)
      continue
    }
    parts.push(a)
  }
  return {
    raw: parts.join(' ').trim() || 'Analise meu projeto.',
    scope: scope || process.env.AIOS_SCOPE,
  }
}

async function main(): Promise<void> {
  const { raw, scope } = parseArgs(process.argv.slice(2))
  const intent = resolveIntent(raw)
  const policies = loadPolicies()
  const applied = applyPolicies(policies.rules)
  const context = gatherContext({
    repoPath: process.cwd(),
    scope,
  })
  const results = await runWorkflow(intent, {
    policies: policies.rules,
    context,
  })
  const verdict = evaluateQuality(results)

  console.log(
    JSON.stringify(
      {
        intent,
        policies: {
          source: policies.source,
          path: policies.path,
          count: policies.rules.length,
          mustIds: applied.mustIds,
        },
        context: {
          repoPath: context.repoPath,
          scope: context.scope,
          snippetCount: context.snippets.length,
          paths: context.snippets.map((s) => s.path),
          signals: context.signals,
        },
        results,
        verdict,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
