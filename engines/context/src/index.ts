/** Context Engine — Recupera código e docs relevantes do repositório. */
export type ContextBundle = {
  repoPath: string
  snippets: string[]
}

export function gatherContext(repoPath: string): ContextBundle {
  return { repoPath, snippets: [] }
}
