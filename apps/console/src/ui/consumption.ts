import type { GovernanceStatus } from './types';

/** Format Health strip chip for provider chat consumption (#118). */
export function formatConsumptionChip(metrics: GovernanceStatus['metrics']): {
  tone: 'ok' | 'bad' | '';
  label: string;
} {
  const pc = metrics.providerChat;
  if (!pc) {
    return {
      tone: '',
      label: metrics.available
        ? `${metrics.eventCount ?? 0} events (no chat yet)`
        : 'no chat events',
    };
  }
  const tone = pc.errorCount > 0 ? 'bad' : 'ok';
  return {
    tone,
    label: `${pc.count} chat · ~${pc.totalTokens} tok${
      pc.errorCount ? ` · ${pc.errorCount} err` : ''
    }`,
  };
}
