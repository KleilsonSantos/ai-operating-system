/**
 * Provider resilience — retry (transient) + circuit breaker (Resource-Aware).
 * Issue #238 · patterns: Retry / Circuit Breaker / Timeout (timeout stays in providers).
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export type ResilienceOptions = {
  /** Max retries after the first attempt (default 2 → 3 total tries). */
  maxRetries?: number;
  /** Base backoff ms before retry (default 200; linear: n * backoff). */
  retryBackoffMs?: number;
  /** Failures in a row to open the circuit (default 5). */
  circuitFailureThreshold?: number;
  /** Ms to stay open before half-open probe (default 30_000). */
  circuitCooldownMs?: number;
  /** Disable retry + circuit (timeout still applies in providers). */
  resilience?: boolean;
};

export type ResolvedResilience = {
  maxRetries: number;
  retryBackoffMs: number;
  circuitFailureThreshold: number;
  circuitCooldownMs: number;
  enabled: boolean;
};

export function resolveResilience(opts: ResilienceOptions = {}): ResolvedResilience {
  return {
    maxRetries: opts.maxRetries ?? 2,
    retryBackoffMs: opts.retryBackoffMs ?? 200,
    circuitFailureThreshold: opts.circuitFailureThreshold ?? 5,
    circuitCooldownMs: opts.circuitCooldownMs ?? 30_000,
    enabled: opts.resilience !== false,
  };
}

/** Transient = network / abort / HTTP 408, 429, 5xx (from error message patterns). */
export function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (err.name === 'AbortError' || msg.includes('aborted')) return true;
  if (
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') ||
    msg.includes('fetch failed') ||
    msg.includes('network')
  ) {
    return true;
  }
  const http = msg.match(/http\s+(\d{3})/i);
  if (http) {
    const code = Number(http[1]);
    return code === 408 || code === 429 || code >= 500;
  }
  return false;
}

export class CircuitBreaker {
  private failures = 0;
  private state: CircuitState = 'closed';
  private openedAt = 0;

  constructor(
    private readonly failureThreshold: number,
    private readonly cooldownMs: number,
    private readonly now: () => number = () => Date.now()
  ) {}

  getState(): CircuitState {
    if (this.state === 'open' && this.now() - this.openedAt >= this.cooldownMs) {
      this.state = 'half-open';
    }
    return this.state;
  }

  /** Throws if circuit is open (not yet half-open). */
  assertCanPass(): void {
    const s = this.getState();
    if (s === 'open') {
      throw new Error(
        `Circuit open — provider unavailable (retry after ${this.cooldownMs}ms cooldown)`
      );
    }
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures += 1;
    if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = this.now();
    }
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: {
    maxRetries: number;
    retryBackoffMs: number;
    sleep?: (ms: number) => Promise<void>;
  }
): Promise<T> {
  const sleep =
    opts.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  let lastErr: unknown;
  const attempts = opts.maxRetries + 1;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const last = i === attempts - 1;
      if (last || !isTransientError(err)) {
        throw err;
      }
      await sleep(opts.retryBackoffMs * (i + 1));
    }
  }
  throw lastErr;
}
