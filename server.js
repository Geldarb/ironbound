// Ironbound server: serves the static game and co-op rooms over WebSocket (/ws). Honours PORT, binds 0.0.0.0, GET /healthz.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { RoomManager } from './server/rooms.js';
import { MAX_RAW } from './src/coop-proto.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
const PUBLIC = [/^\/$/, /^\/index\.html$/, /^\/css\/[\w.-]+$/, /^\/src\/[\w.-]+\.js$/];

export function createServer({ rooms = new RoomManager({ rng: () => randomInt(0, 2 ** 31) / 2 ** 31 }) } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p === '/healthz') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, ...rooms.stats() })); return; }
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
      if (!PUBLIC.some((r) => r.test(p)) || p.includes('..')) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); return; }
      if (p === '/') p = '/index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      if (!(await stat(file)).isFile()) throw new Error('nf');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff', 'content-length': body.length });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found');
    }
  });
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_RAW });
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    const conn = rooms.attach({ send(obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }, close(code, reason) { try { ws.close(code, reason); } catch { /* ignore */ } } });
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', (raw, isBinary) => {
      if (isBinary) return conn.send({ t: 'error', err: 'binary_not_allowed' });
      let m; try { m = JSON.parse(raw.toString('utf8')); } catch { return conn.send({ t: 'error', err: 'bad_json' }); }
      try { rooms.handle(conn, m); } catch (e) { conn.send({ t: 'error', err: 'server_error' }); console.error('ws handle error', e); }
    });
    ws.on('close', () => rooms.disconnect(conn));
    ws.on('error', () => {});
  });
  const beat = setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch { /* ignore */ } } }, 20000);
  const sweep = setInterval(() => rooms.sweep(), 5000);
  server.on('close', () => { clearInterval(beat); clearInterval(sweep); wss.close(); });
  server.rooms = rooms;
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  createServer().listen(port, '0.0.0.0', () => console.log(`Ironbound listening on 0.0.0.0:${port}`));
}
