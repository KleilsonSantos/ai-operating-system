import { useCallback, useEffect, useState } from 'react'
import type { GovernanceStatus } from './types'
import { TryItPanel } from './TryItPanel'

function severityLabel(s: string): string {
  if (s === 'error') return 'Atenção'
  if (s === 'warn') return 'Aviso'
  return 'Info'
}

export function App() {
  const [status, setStatus] = useState<GovernanceStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as GovernanceStatus
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 20_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const errors = status?.attention.filter((a) => a.severity === 'error').length ?? 0
  const warns = status?.attention.filter((a) => a.severity === 'warn').length ?? 0
  const workspaceId =
    status?.workspaces.find((w) => w.ok)?.id ||
    status?.workspaces[0]?.id ||
    'aios'

  return (
    <div className="shell">
      <header className="hero">
        <p className="brand">AIOS</p>
        <h1>Console de governança</h1>
        <p className="lede">
          Estado, atenção e ações seguras que provam o runtime — sem substituir a
          IDE nem chamar agentes no UX.
        </p>
        <div className="actions">
          <button type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'A atualizar…' : 'Atualizar'}
          </button>
          {status && (
            <span className="meta">
              contract v{status.contractVersion} · {status.generatedAt}
            </span>
          )}
        </div>
      </header>

      {error && (
        <p className="banner error" role="alert">
          API: {error}. Corre <code>pnpm --filter @aios/console api</code> (porta
          8787).
        </p>
      )}

      {status && (
        <>
          <section className="strip" aria-label="Resumo">
            <div className={`chip ${errors ? 'bad' : 'ok'}`}>
              <span className="chip-k">Atenção</span>
              <span className="chip-v">
                {errors} erro{errors === 1 ? '' : 's'} · {warns} aviso
                {warns === 1 ? '' : 's'}
              </span>
            </div>
            <div className={`chip ${status.provider.ok ? 'ok' : 'bad'}`}>
              <span className="chip-k">Provider</span>
              <span className="chip-v">
                {status.provider.provider}{' '}
                {status.provider.ok ? 'ativo' : 'inativo'}
              </span>
            </div>
            <div className="chip">
              <span className="chip-k">Workspaces</span>
              <span className="chip-v">
                {status.workspaces.filter((w) => w.ok).length}/
                {status.workspaces.length} ok
              </span>
            </div>
            <div className="chip">
              <span className="chip-k">Policies must</span>
              <span className="chip-v">{status.policies.mustIds.length}</span>
            </div>
            <div className="chip">
              <span className="chip-k">MCP tools</span>
              <span className="chip-v">{status.exposed.mcpTools.length}</span>
            </div>
          </section>

          <div className="grid grid-3">
            <TryItPanel
              workspaceId={workspaceId}
              onAfterAction={() => void refresh()}
            />

            <section className="panel attention" aria-labelledby="att-h">
              <h2 id="att-h">Needs attention</h2>
              {status.attention.length === 0 ? (
                <p className="quiet">Nada a assinalar neste momento.</p>
              ) : (
                <ul className="att-list">
                  {status.attention.map((item) => (
                    <li key={item.id} className={`att ${item.severity}`}>
                      <span className="att-sev">{severityLabel(item.severity)}</span>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel" aria-labelledby="state-h">
              <h2 id="state-h">Estado</h2>
              <dl className="kv">
                <dt>Home</dt>
                <dd>
                  <code>{status.homePath}</code>
                </dd>
                <dt>Provider URL</dt>
                <dd>
                  <code>{status.provider.baseUrl}</code>
                  {status.provider.latencyMs != null && (
                    <> · {status.provider.latencyMs}ms</>
                  )}
                </dd>
                <dt>Modelos</dt>
                <dd>
                  {status.provider.models?.length
                    ? status.provider.models.join(', ')
                    : '—'}
                </dd>
                <dt>Memória</dt>
                <dd>
                  {status.memory.workspaceIds.length
                    ? status.memory.workspaceIds.join(', ')
                    : 'nenhuma'}
                </dd>
                <dt>Consumo</dt>
                <dd>
                  {status.metrics.available
                    ? `${status.metrics.eventCount ?? 0} eventos`
                    : 'stub'}{' '}
                  — {status.metrics.note}
                </dd>
              </dl>

              <h3>Workspaces</h3>
              <ul className="plain">
                {status.workspaces.map((w) => (
                  <li key={w.id}>
                    <span className={w.ok ? 'dot ok' : 'dot bad'} />
                    <code>{w.id}</code> {w.name ? `(${w.name})` : ''}
                    <span className="path">{w.repoPath}</span>
                  </li>
                ))}
              </ul>

              <h3>Disponibilizado (MCP)</h3>
              <p className="tools">
                {status.exposed.mcpTools.map((t) => (
                  <code key={t}>{t}</code>
                ))}
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
