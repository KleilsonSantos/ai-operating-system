/**
 * API local do console — GET /api/status (Health + Attention).
 * Porta: AIOS_CONSOLE_PORT ou 8787.
 */
import { createServer } from 'node:http'
import { getGovernanceStatus } from '@aios/status'

const port = Number(process.env.AIOS_CONSOLE_PORT || 8787)
const homePath = process.env.AIOS_HOME || process.cwd()

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/status') {
    try {
      const status = await getGovernanceStatus({ homePath })
      const body = JSON.stringify(status, null, 2)
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      res.end(body)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: message }))
    }
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, service: 'aios-console-api' }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(port, '127.0.0.1', () => {
  console.error(`aios console api http://127.0.0.1:${port} (home=${homePath})`)
})
