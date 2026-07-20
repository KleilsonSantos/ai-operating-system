/**
 * Opt-in Streamable HTTP transport for @aios/mcp (#137 / ADR-0022).
 * Pattern: SDK simpleStatelessStreamableHttp — new server+transport per POST.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { Request, Response } from 'express';
import type { Server } from 'node:http';
import type { McpLaunchOptions } from './launch-options.ts';

export type ListenStreamableHttpOptions = McpLaunchOptions & {
  createServer: () => McpServer;
};

export async function listenStreamableHttp(options: ListenStreamableHttpOptions): Promise<Server> {
  const app = createMcpExpressApp({ host: options.host });

  app.post('/mcp', async (req: Request, res: Response) => {
    const server = options.createServer();
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
    } catch (err) {
      console.error('aios MCP HTTP request failed:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  // Stateless MVP: no SSE GET / session DELETE (same as SDK simpleStateless example)
  app.get('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
  });
  app.delete('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'aios-mcp', transport: 'streamable-http' });
  });

  return await new Promise<Server>((resolve, reject) => {
    const httpServer = app.listen(options.port, options.host, () => {
      if (process.env.AIOS_MCP_QUIET !== '1') {
        console.error(
          `aios MCP streamable-http http://${options.host}:${options.port}/mcp (stateless)`
        );
      }
      resolve(httpServer);
    });
    httpServer.on('error', reject);
  });
}
