import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VisibilitySnapshot, VisibilityTrailItem } from '@aios/shared';
import { decisionRowsFromRun, formatDecisionLabel } from './decision-rows';

type TrailFilter = 'all' | 'policy' | 'pipeline.step' | 'agent.execution' | 'decision';

type ActionResult = {
  ok: boolean;
  action: string;
  latencyMs: number;
  result: unknown;
  error?: string;
};

type Props = {
  workspaceId: string;
  /** When set (e.g. Attention Inspect), prefills run id and reloads trail (#528). */
  focusRequest?: { runId: string; n: number } | null;
};

function isSnapshot(value: unknown): value is VisibilitySnapshot {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Array.isArray((value as VisibilitySnapshot).trail) &&
    (value as VisibilitySnapshot).anchor
  );
}

export function RunTrailPanel({ workspaceId, focusRequest }: Props) {
  const [filter, setFilter] = useState<TrailFilter>('all');
  const [scope, setScope] = useState('');
  const [runId, setRunId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [snap, setSnap] = useState<VisibilitySnapshot | null>(null);

  const load = useCallback(
    async (overrideRunId?: string) => {
      setBusy(true);
      setError(null);
      const effectiveRunId = (overrideRunId ?? runId).trim() || undefined;
      try {
        const res = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'visibility',
            workspaceId,
            scope: scope.trim() || undefined,
            runId: effectiveRunId,
          }),
        });
        const data = (await res.json()) as ActionResult;
        setLatencyMs(data.latencyMs);
        if (!data.ok || data.error) {
          setSnap(null);
          setError(data.error || 'visibility failed');
          return;
        }
        if (!isSnapshot(data.result)) {
          setSnap(null);
          setError('invalid VisibilitySnapshot');
          return;
        }
        setSnap(data.result);
      } catch (err) {
        setSnap(null);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [workspaceId, scope, runId]
  );

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = focusRequest?.runId?.trim();
    if (!id) return;
    setRunId(id);
    setFilter('decision');
    void loadRef.current(id);
  }, [focusRequest]);

  const rows = useMemo(() => {
    const trail = snap?.trail ?? [];
    if (filter === 'all') return trail;
    return trail.filter((t) => t.kind === filter);
  }, [snap, filter]);

  const decisionRows = useMemo(() => decisionRowsFromRun(snap?.run?.decisions), [snap]);

  return (
    <section className="panel run-trail" aria-labelledby="trail-h" id="run-trail">
      <h2 id="trail-h">Run trail</h2>
      <p className="quiet">
        Visibility Plane — policies, pipeline steps, decisions e <code>agent.execution</code>{' '}
        correlacionados (ADR-0030 / ADR-0034). Informe um <code>runId</code> persistido para
        carregar o ledger. On-demand; sem agentes no UX.
      </p>

      <div className="trail-controls">
        <label className="field">
          <span>Scope (opcional)</span>
          <input
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="ex.: engines/policy"
          />
        </label>
        <label className="field">
          <span>Run id (opcional)</span>
          <input
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
            placeholder="ex.: run-…"
            autoComplete="off"
          />
        </label>
        <button type="button" onClick={() => void load()} disabled={busy}>
          {busy ? 'A correlacionar…' : 'Atualizar trail'}
        </button>
        {latencyMs != null && <span className="meta">{latencyMs}ms</span>}
      </div>

      <div className="catalog-tabs" role="tablist" aria-label="Filtro do trail">
        {(
          [
            ['all', 'Todos'],
            ['policy', 'Policies'],
            ['pipeline.step', 'Steps'],
            ['decision', 'Decisions'],
            ['agent.execution', 'Agents'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={filter === id ? 'active' : undefined}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="banner error" role="alert">
          {error}
        </p>
      )}

      {snap && (
        <p className="quiet trail-meta">
          workspace <code>{snap.anchor.workspaceId || workspaceId}</code>
          {snap.anchor.scope ? (
            <>
              {' '}
              · scope <code>{snap.anchor.scope}</code>
            </>
          ) : null}
          {snap.runLookup ? (
            <>
              {' '}
              · run <code>{snap.runLookup}</code>
            </>
          ) : null}
          {' · '}
          KG {snap.knowledge.nodeCount}n/{snap.knowledge.edgeCount}e · trail {snap.trail.length}
          {decisionRows.length > 0 ? <> · decisions {decisionRows.length}</> : null}
        </p>
      )}

      {decisionRows.length > 0 ? (
        <div className="decisions-block" aria-labelledby="decisions-h">
          <h3 id="decisions-h">Decisions</h3>
          <p className="quiet">
            Ledger tipado do <code>PipelineRun</code> (ADR-0034) — subject / outcome / value.
          </p>
          <ul className="trail-list decisions-list">
            {decisionRows.map((row) => (
              <li key={row.id} className="trail-row kind-decision">
                <span className="trail-kind">{row.subject}</span>
                <strong className="trail-label">{formatDecisionLabel(row)}</strong>
                <span className="trail-status">{row.outcome}</span>
                {row.stepId ? (
                  <span className="trail-at">
                    step <code>{row.stepId}</code>
                  </span>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!busy && !error && rows.length === 0 ? (
        <p className="quiet">Nenhum item no trail para este filtro.</p>
      ) : (
        <ul className="trail-list">
          {rows.map((item) => (
            <TrailRow key={`${item.kind}:${item.id}:${item.at ?? ''}`} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TrailRow({ item }: { item: VisibilityTrailItem }) {
  return (
    <li className={`trail-row kind-${item.kind.replace('.', '-')}`}>
      <span className="trail-kind">{item.kind}</span>
      <strong className="trail-label">{item.label}</strong>
      {item.status ? <span className="trail-status">{item.status}</span> : <span />}
      {item.at ? (
        <time className="trail-at" dateTime={item.at}>
          {item.at}
        </time>
      ) : (
        <span />
      )}
    </li>
  );
}
