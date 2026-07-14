import { runPipeline, PIPELINE_CONTRACT_VERSION } from '@aios/pipeline'

function parseArgs(argv: string[]): {
  input: string
  scope?: string
  repoPath?: string
  policiesPath?: string
} {
  let scope: string | undefined
  let repoPath: string | undefined
  let policiesPath: string | undefined
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
    if (a === '--repo') {
      repoPath = argv[++i]
      continue
    }
    if (a.startsWith('--repo=')) {
      repoPath = a.slice('--repo='.length)
      continue
    }
    if (a === '--policies') {
      policiesPath = argv[++i]
      continue
    }
    if (a.startsWith('--policies=')) {
      policiesPath = a.slice('--policies='.length)
      continue
    }
    if (a === '--contract-version') {
      console.log(PIPELINE_CONTRACT_VERSION)
      process.exit(0)
    }
    parts.push(a)
  }

  return {
    input: parts.join(' ').trim() || 'Analise meu projeto.',
    scope: scope || process.env.AIOS_SCOPE,
    repoPath: repoPath || process.env.AIOS_REPO,
    policiesPath: policiesPath || process.env.AIOS_POLICIES_PATH,
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const response = await runPipeline({
    input: args.input,
    repoPath: args.repoPath,
    scope: args.scope,
    policiesPath: args.policiesPath,
  })

  console.log(JSON.stringify(response, null, 2))

  if (!response.verdict.passed) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
