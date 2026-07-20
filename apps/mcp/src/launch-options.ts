/**
 * MCP process launch options (#137).
 * Default remains stdio — HTTP is opt-in (Resource-Aware).
 */

export const DEFAULT_MCP_HTTP_PORT = 8791;
export const DEFAULT_MCP_HTTP_HOST = '127.0.0.1';

export type McpLaunchOptions = {
  http: boolean;
  port: number;
  host: string;
};

function parsePort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`invalid MCP port: ${raw}`);
  }
  return n;
}

/**
 * Resolve launch mode from argv + env.
 * HTTP when `--http` or `AIOS_MCP_HTTP=1`.
 * Port: `--port N` · `AIOS_MCP_PORT` · default 8791.
 * Host: `AIOS_MCP_HOST` · default 127.0.0.1 (never 0.0.0.0 unless set).
 */
export function parseMcpLaunchOptions(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env
): McpLaunchOptions {
  let http = env.AIOS_MCP_HTTP === '1';
  let port = parsePort(env.AIOS_MCP_PORT, DEFAULT_MCP_HTTP_PORT);
  const host = (env.AIOS_MCP_HOST || DEFAULT_MCP_HTTP_HOST).trim() || DEFAULT_MCP_HTTP_HOST;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--http') {
      http = true;
      continue;
    }
    if (arg === '--port') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        throw new Error('--port requires a value');
      }
      port = parsePort(next, port);
      i++;
      continue;
    }
    if (arg?.startsWith('--port=')) {
      port = parsePort(arg.slice('--port='.length), port);
    }
  }

  return { http, port, host };
}
