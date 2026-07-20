/**
 * API local do console — status + safe actions (#71 · #76) + Prometheus (#130).
 * Porta: AIOS_CONSOLE_PORT ou 8787.
 */
import { createServer } from 'node:http';
import {
  getGovernanceStatus,
  renderPrometheusMetrics,
  PROMETHEUS_CONTENT_TYPE,
} from '@aios/status';
import { runSafeAction, SAFE_ACTIONS } from './actions.ts';

const port = Number(process.env.AIOS_CONSOLE_PORT || 8787);
const homePath = process.env.AIOS_HOME || process.cwd();
const INTERNAL_ERROR_MESSAGE = 'internal server error';

function sendJson(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body, null, 2));
}

function sendPrometheus(res: import('node:http').ServerResponse, body: string): void {
  res.writeHead(200, {
    'Content-Type': PROMETHEUS_CONTENT_TYPE,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function sendInternalError(
  res: import('node:http').ServerResponse,
  err: unknown,
  context: string
): void {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`[console-api] ${context}: ${detail}`);
  sendJson(res, 500, { error: INTERNAL_ERROR_MESSAGE });
}

async function readJsonBody(req: import('node:http').IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw) as unknown;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/metrics' || url.pathname === '/api/metrics')) {
    try {
      sendPrometheus(res, renderPrometheusMetrics({ homePath }));
    } catch (err) {
      sendInternalError(res, err, 'metrics');
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/status') {
    try {
      const status = await getGovernanceStatus({ homePath });
      sendJson(res, 200, status);
    } catch (err) {
      sendInternalError(res, err, 'status');
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'aios-console-api' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/actions') {
    sendJson(res, 200, { actions: SAFE_ACTIONS });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/action') {
    try {
      const body = (await readJsonBody(req)) as {
        action?: string;
        input?: string;
        workspaceId?: string;
      };
      if (!body.action || typeof body.action !== 'string') {
        sendJson(res, 400, { error: 'body.action required' });
        return;
      }
      const out = await runSafeAction({
        action: body.action,
        input: body.input,
        workspaceId: body.workspaceId,
        homePath,
      });
      const statusCode = out.error && !out.result ? 400 : 200;
      sendJson(res, statusCode, out);
    } catch (err) {
      sendInternalError(res, err, 'action');
    }
    return;
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(port, '127.0.0.1', () => {
  console.error(`aios console api http://127.0.0.1:${port} (home=${homePath}; metrics=/metrics)`);
});
