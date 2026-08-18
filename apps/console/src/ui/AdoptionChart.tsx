import { useState } from 'react';
import type { AgentAdoptionSeries } from '@aios/shared';

type AdoptionWindow = 7 | 30;

type Props = {
  adoption7d?: AgentAdoptionSeries;
  adoption30d?: AgentAdoptionSeries;
  topAgents?: string[];
};

export function AdoptionChart({ adoption7d, adoption30d, topAgents = [] }: Props) {
  const [windowDays, setWindowDays] = useState<AdoptionWindow>(7);
  const series = windowDays === 30 ? adoption30d : adoption7d;

  if (!series || series.total.every((n) => n === 0)) {
    return (
      <p className="quiet adoption-empty">
        No runs in the last {windowDays} days — run a pipeline to populate adoption curves.
      </p>
    );
  }

  const max = Math.max(1, ...series.total);
  const agentKeys =
    topAgents.length > 0
      ? topAgents.filter((name) => series.byAgent[name]?.some((n) => n > 0))
      : Object.keys(series.byAgent)
          .filter((name) => series.byAgent[name]?.some((n) => n > 0))
          .slice(0, 3);

  return (
    <div className="adoption-chart" aria-labelledby="adoption-h">
      <div className="adoption-head">
        <h3 id="adoption-h">Adoption (runs / day)</h3>
        <div className="adoption-tabs" role="tablist" aria-label="Adoption window">
          {([7, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              role="tab"
              aria-selected={windowDays === days}
              className={windowDays === days ? 'active' : ''}
              onClick={() => setWindowDays(days)}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>
      <div
        className="adoption-bars"
        role="img"
        aria-label={`Agent runs per UTC day, ${windowDays} days`}
      >
        {series.buckets.map((day, idx) => {
          const value = series.total[idx] ?? 0;
          const height = Math.max(4, Math.round((value / max) * 100));
          return (
            <div key={day} className="adoption-bar-wrap" title={`${day}: ${value} run(s)`}>
              <div className="adoption-bar" style={{ height: `${height}%` }} />
              <span className="adoption-bar-label">{day.slice(5)}</span>
              <span className="adoption-bar-value">{value || ''}</span>
            </div>
          );
        })}
      </div>
      {agentKeys.length > 0 && (
        <ul className="adoption-agents">
          {agentKeys.map((name) => {
            const counts = series.byAgent[name] ?? [];
            const agentMax = Math.max(1, ...counts);
            return (
              <li key={name}>
                <span className="adoption-agent-name" title={name}>
                  {(name.split('/').pop() || name).replace('@aios/', '')}
                </span>
                <span className="adoption-spark" aria-hidden="true">
                  {counts.map((n, i) => (
                    <span
                      key={`${name}-${series.buckets[i]}`}
                      className="adoption-spark-bar"
                      style={{ height: `${Math.max(2, Math.round((n / agentMax) * 100))}%` }}
                    />
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
