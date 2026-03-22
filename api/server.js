/**
 * dashboard-api / server.js
 *
 * Minimal HTTP server: queries the Docker Unix socket and returns running containers as JSON.
 * No extra npm deps — Node.js built-ins only.
 *
 * GET /api/containers  →  { containers: [...], ts: <epoch ms> }
 * GET /health          →  { ok: true }
 */

'use strict';

const http        = require('http');
const net         = require('net');

const PORT        = Number(process.env.PORT)        || 2999;
const DOCKER_SOCK = process.env.DOCKER_SOCK         || '/var/run/docker.sock';
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS   || '*').split(',');

// Comma-separated list: "name|healthUrl,name2|healthUrl2"
const EXTRA_SERVICES_RAW = process.env.EXTRA_SERVICES || '';
const EXTRA_SERVICES = EXTRA_SERVICES_RAW
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => { const [name, url] = s.split('|'); return { name, url }; });

/* ── Chunked Transfer Encoding Decoder ───────────── */
function decodeChunked(body) {
  let result = '';
  let pos    = 0;

  while (pos < body.length) {
    const lineEnd = body.indexOf('\r\n', pos);
    if (lineEnd === -1) break;

    const sizeHex = body.slice(pos, lineEnd).trim();
    const size    = parseInt(sizeHex, 16);

    if (isNaN(size) || size === 0) break;

    result += body.slice(lineEnd + 2, lineEnd + 2 + size);
    pos = lineEnd + 2 + size + 2; // skip trailing \r\n
  }

  return result || body; // fallback: return as-is if not chunked
}

/* ── HTTP Health Check ───────────────────────────── */
function httpHealthCheck(url) {
  return new Promise(resolve => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    const req = mod.get(url, { timeout: 3000 }, res => {
      resolve(res.statusCode >= 200 && res.statusCode < 300);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

/* ── Docker Socket HTTP Request ──────────────────── */
function dockerGet(path) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(DOCKER_SOCK);
    const chunks = [];

    socket.setTimeout(5000);

    socket.on('connect', () => {
      socket.write(
        `GET ${path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`
      );
    });

    socket.on('data', chunk => chunks.push(chunk));

    socket.on('end', () => {
      const raw      = Buffer.concat(chunks).toString('utf8');
      const headerEnd = raw.indexOf('\r\n\r\n');
      const rawBody   = headerEnd >= 0 ? raw.slice(headerEnd + 4) : raw;

      // Detect chunked encoding
      const headers    = raw.slice(0, headerEnd).toLowerCase();
      const isChunked  = headers.includes('transfer-encoding: chunked');
      const body       = isChunked ? decodeChunked(rawBody) : rawBody;

      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Docker API: invalid JSON — ' + body.slice(0, 300)));
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Docker socket timeout'));
    });

    socket.on('error', reject);
  });
}

/* ── CORS Helper ─────────────────────────────────── */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '*';
  const allowed = ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)
    ? origin
    : 'null';

  res.setHeader('Access-Control-Allow-Origin',  allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

/* ── HTTP Server ─────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const url = req.url.split('?')[0];

  /* ── GET /health ── */
  if (url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, ts: Date.now() }));
    return;
  }

  /* ── GET /api/containers ── */
  if (url === '/api/containers') {
    try {
      const raw = await dockerGet('/containers/json?all=false');

      const containers = raw.map(c => ({
        id:     c.Id.slice(0, 12),
        name:   (c.Names[0] || '').replace(/^\//, ''),
        image:  c.Image,
        state:  c.State,
        status: c.Status,
        ports:  c.Ports
          .map(p => p.PublicPort)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i),
      }));

      // Append extra services via HTTP health checks
      if (EXTRA_SERVICES.length > 0) {
        const checks = await Promise.all(
          EXTRA_SERVICES.map(async ({ name, url: healthUrl }) => ({
            name,
            alive: await httpHealthCheck(healthUrl),
          }))
        );
        for (const { name, alive } of checks) {
          if (alive) {
            containers.push({ id: 'systemd', name, image: 'systemd', state: 'running', status: 'running', ports: [] });
          }
        }
      }

      res.writeHead(200);
      res.end(JSON.stringify({ containers, ts: Date.now() }));
    } catch (err) {
      console.error('[Docker]', err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[dashboard-api] Listening on :${PORT}`);
  console.log(`[dashboard-api] Docker socket: ${DOCKER_SOCK}`);
});

server.on('error', err => {
  console.error('[dashboard-api] Server error:', err.message);
  process.exit(1);
});
