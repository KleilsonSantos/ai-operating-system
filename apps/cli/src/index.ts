import { resolveIntent } from '@aios/intent'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { gatherContext } from '@aios/context'
import { runWorkflow } from '@aios/orchestration'
import { evaluateQuality } from '@aios/quality-gate'

async function main(): Promise<void> {
  const raw = process.argv.slice(2).join(' ') || 'Analise meu projeto.'
  const intent = resolveIntent(raw)
  const bundle = loadPolicies()
  const applied = applyPolicies(bundle.rules)
  const context = gatherContext(process.cwd())
  const results = await runWorkflow(intent, { policies: bundle.rules })
  const verdict = evaluateQuality(results)

  console.log(
    JSON.stringify(
      {
        intent,
        policies: {
          source: bundle.source,
          path: bundle.path,
          count: bundle.rules.length,
          mustIds: applied.mustIds,
        },
        contextRepo: context.repoPath,
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
