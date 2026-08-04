/**
 * JSON helpers for console HTTP responses — never leak Error.stack to clients
 * (CodeQL js/stack-trace-exposure / CWE-209).
 */
export function sanitizeForClientJson(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForClientJson);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'stack' && typeof child === 'string') {
        continue;
      }
      out[key] = sanitizeForClientJson(child);
    }
    return out;
  }
  return value;
}

export function stringifyClientJson(body: unknown): string {
  return JSON.stringify(sanitizeForClientJson(body), null, 2);
}
