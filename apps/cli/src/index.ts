import { resolveIntent } from '@aios/intent'
import { loadPolicies } from '@aios/policy'
import { gatherContext } from '@aios/context'
import { runWorkflow } from '@aios/orchestration'
import { evaluateQuality } from '@aios/quality-gate'

async function main(): Promise<void> {
  const raw = process.argv.slice(2).join(' ') || 'Analise meu projeto.'
  const intent = resolveIntent(raw)
  const policies = loadPolicies()
  const context = gatherContext(process.cwd())
  const results = await runWorkflow(intent)
  const verdict = evaluateQuality(results)

  console.log(
    JSON.stringify(
      {
        intent,
        policyCount: policies.length,
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
