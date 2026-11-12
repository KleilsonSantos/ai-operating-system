/**
 * Request guard for the local console API (127.0.0.1).
 * Rejects foreign `Host` values (DNS rebinding) and cross-site `Origin` values (any other web
 * page calling the API from the browser). Requests without `Origin` (curl, Postman, Prometheus
 * scrape) are not browser cross-site requests and pass when `Host` is loopback.
 */

type HeaderBag = Record<string, string | string[] | undefined>;
type EnvMap = Record<string, string | undefined>;

const LOOPBACK_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '[::1]']);

/** Vite dev UI origins (proxy keeps the browser `Origin`). */
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function originOf(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function allowedConsoleOrigins(env: EnvMap = process.env): Set<string> {
  const out = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  for (const part of (env.AIOS_CONSOLE_ALLOWED_ORIGINS || '').split(',')) {
    const origin = originOf(part.trim());
    if (origin) out.add(origin);
  }
  return out;
}

export type ConsoleGuardDecision = { ok: true } | { ok: false; reason: 'host' | 'origin' };

export function checkConsoleRequest(
  headers: HeaderBag,
  env: EnvMap = process.env
): ConsoleGuardDecision {
  const host = single(headers.host)?.trim();
  if (!host) return { ok: false, reason: 'host' };
  let hostname: string;
  try {
    hostname = new URL(`http://${host}`).hostname;
  } catch {
    return { ok: false, reason: 'host' };
  }
  if (!LOOPBACK_HOSTNAMES.has(hostname)) return { ok: false, reason: 'host' };

  const rawOrigin = single(headers.origin)?.trim();
  if (rawOrigin !== undefined) {
    const origin = originOf(rawOrigin);
    if (!origin || !allowedConsoleOrigins(env).has(origin)) {
      return { ok: false, reason: 'origin' };
    }
  }
  return { ok: true };
}
