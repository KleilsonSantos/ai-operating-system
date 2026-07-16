import { useState } from 'react'

type ActionDef = {
  id: string
  label: string
  hint: string
  needsInput?: boolean
  placeholder?: string
}

const ACTIONS: ActionDef[] = [
  {
    id: 'contract',
    label: 'Contract version',
    hint: 'PIPELINE_CONTRACT_VERSION',
  },
  {
    id: 'validate_workspaces',
    label: 'Validar workspaces',
    hint: 'Registry + paths',
  },
  {
    id: 'load_policies',
    label: 'Carregar policies',
    hint: 'mustIds + constraints',
  },
  {
    id: 'compile_brief',
    label: 'Gerar brief',
    hint: 'Prompt Engine (economia de tokens)',
    needsInput: true,
    placeholder: 'Pedido curto, ex.: Analise o engine status',
  },
  {
    id: 'provider_ping',
    label: 'Ping provider',
    hint: 'Ollama opcional — warn se off',
  },
  {
    id: 'memory_recall',
    label: 'Recall memória',
    hint: 'Últimas entradas do workspace',
  },
  {
    id: 'memory_remember',
    label: 'Remember',
    hint: 'Grava nota curta de teste',
    needsInput: true,
    placeholder: 'Nota opcional…',
  },
  {
    id: 'audit_docs',
    label: 'Audit docs',
    hint: 'Documentation Engine — drift canónico',
  },
  {
    id: 'governance_audit',
    label: 'Governance audit',
    hint: 'Policies + decisões + docs',
  },
  {
    id: 'operational_state',
    label: 'Operational state',
    hint: 'Snapshot unificado (#84) — sem voz/IDE',
  },
]

type ActionResult = {
  ok: boolean
  action: string
  latencyMs: number
  result: unknown
  error?: string
}

type Props = {
  workspaceId: string
  onAfterAction?: () => void
}

export function TryItPanel({ workspaceId, onAfterAction }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [last, setLast] = useState<ActionResult | null>(null)

  async function run(actionId: string) {
    setBusy(actionId)
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionId,
          workspaceId,
          input: input || undefined,
        }),
      })
      const data = (await res.json()) as ActionResult
      setLast(data)
      onAfterAction?.()
    } catch (err) {
      setLast({
        ok: false,
        action: actionId,
        latencyMs: 0,
        result: null,
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="panel tryit" aria-labelledby="try-h">
      <h2 id="try-h">Try it</h2>
      <p className="quiet">
        Ações seguras nos engines — prova que o runtime funciona. Sem agentes no
        UX.
      </p>
      <label className="field">
        <span>Workspace</span>
        <code>{workspaceId}</code>
      </label>
      <label className="field">
        <span>Input (brief / remember)</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Opcional…"
        />
      </label>
      <ul className="try-list">
        {ACTIONS.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className="try-btn"
              disabled={busy !== null}
              onClick={() => void run(a.id)}
            >
              {busy === a.id ? '…' : a.label}
            </button>
            <span className="try-hint">{a.hint}</span>
          </li>
        ))}
      </ul>
      {last && (
        <div className={`try-out ${last.ok ? 'ok' : 'bad'}`}>
          <header>
            <strong>{last.action}</strong>
            <span>
              {last.ok ? 'ok' : 'fail'} · {last.latencyMs}ms
            </span>
          </header>
          {last.error && <p className="try-err">{last.error}</p>}
          <pre>{JSON.stringify(last.result, null, 2)}</pre>
        </div>
      )}
    </section>
  )
}
