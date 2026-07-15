import { runPipeline, PIPELINE_CONTRACT_VERSION } from '@aios/pipeline'
import { compilePrompt } from '@aios/prompt'

function parseArgs(argv: string[]): {
  input: string
  scope?: string
  repoPath?: string
  workspaceId?: string
  policiesPath?: string
  compilePromptOnly: boolean
  briefOnly: boolean
} {
  let scope: string | undefined
  let repoPath: string | undefined
  let workspaceId: string | undefined
  let policiesPath: string | undefined
  let compilePromptOnly = false
  let briefOnly = false
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
    if (a === '--workspace') {
      workspaceId = argv[++i]
      continue
    }
    if (a.startsWith('--workspace=')) {
      workspaceId = a.slice('--workspace='.length)
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
    if (a === '--compile-prompt') {
      compilePromptOnly = true
      continue
    }
    if (a === '--brief-only') {
      briefOnly = true
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
    workspaceId: workspaceId || process.env.AIOS_WORKSPACE,
    policiesPath: policiesPath || process.env.AIOS_POLICIES_PATH,
    compilePromptOnly,
    briefOnly,
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  if (args.compilePromptOnly) {
    const compiled = compilePrompt({
      input: args.input,
      repoPath: args.repoPath,
      workspaceId: args.workspaceId,
      policiesPath: args.policiesPath,
    })
    if (args.briefOnly) {
      console.log(compiled.brief)
    } else {
      console.log(JSON.stringify(compiled, null, 2))
    }
    return
  }

  const response = await runPipeline({
    input: args.input,
    repoPath: args.repoPath,
    workspaceId: args.workspaceId,
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
