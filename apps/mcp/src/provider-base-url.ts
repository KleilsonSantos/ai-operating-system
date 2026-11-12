/**
 * Guard for the model-controlled `baseUrl` argument on `aios_provider_*` tools.
 * Provider API keys come from the operator env and are attached to whatever host the request
 * targets, so an override is accepted only for the provider's own origin or an operator allowlist.
 */
export type McpBaseUrlDecision =
  | { ok: true; baseUrl?: string }
  | { ok: false; reason: 'base-url-invalid' | 'base-url-not-allowed'; providerId: string };

type EnvMap = Record<string, string | undefined>;

function originOf(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function allowedOrigins(env: EnvMap): Set<string> {
  const out = new Set<string>();
  for (const part of (env.AIOS_MCP_ALLOWED_BASE_URLS || '').split(',')) {
    const origin = originOf(part.trim());
    if (origin) out.add(origin);
  }
  return out;
}

/**
 * Resolve the `baseUrl` an MCP tool call may use. No override → provider default.
 * Override → same origin as the provider's configured URL, or listed in
 * `AIOS_MCP_ALLOWED_BASE_URLS` (comma-separated). Anything else is denied.
 */
export function resolveMcpBaseUrl(
  providerId: string,
  requested: string | undefined,
  /** The provider's own configured base URL (`resolveProviderBaseUrl`), injected by the caller. */
  configuredBaseUrl: string | undefined,
  env: EnvMap = process.env
): McpBaseUrlDecision {
  const raw = requested?.trim();
  if (!raw) return { ok: true };

  const origin = originOf(raw);
  if (!origin) return { ok: false, reason: 'base-url-invalid', providerId };

  const configuredOrigin = configuredBaseUrl ? originOf(configuredBaseUrl) : null;
  if (origin === configuredOrigin || allowedOrigins(env).has(origin)) {
    return { ok: true, baseUrl: raw };
  }
  return { ok: false, reason: 'base-url-not-allowed', providerId };
}

export function deniedBaseUrlResult(decision: Extract<McpBaseUrlDecision, { ok: false }>): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          error: 'provider.base_url_denied',
          reason: decision.reason,
          provider: decision.providerId,
          hint: 'Override must match the provider origin or be listed in AIOS_MCP_ALLOWED_BASE_URLS',
        }),
      },
    ],
    isError: true,
  };
}
