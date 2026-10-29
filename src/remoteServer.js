// Phone Remote: a tiny web server on the church Wi-Fi. A phone scans the QR code, opens the page
// served here and sends commands; the control window does the actual work (see 'remote-command').
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');

let server = null;
let token = null;
let port = null;
let handler = null;   // async (cmd) => result
let stateFn = null;   // () => { ref, text } of what is on screen

function lanAddress() {
  const found = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal) found.push(i.address);
    }
  }
  return found.find(a => a.startsWith('192.168.')) || found.find(a => a.startsWith('10.')) || found[0] || null;
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

async function onRequest(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.searchParams.get('t') !== token && req.headers['x-remote-token'] !== token) {
    return send(res, 403, 'This link is no longer valid. Scan the QR code in Studio again.', 'text/plain');
  }
  if (req.method === 'GET' && url.pathname === '/') {
    try {
      return send(res, 200, fs.readFileSync(path.join(__dirname, 'remote.html'), 'utf8'), 'text/html; charset=utf-8');
    } catch (e) { return send(res, 500, 'Remote page missing', 'text/plain'); }
  }
  if (req.method === 'GET' && url.pathname === '/state') {
    return send(res, 200, stateFn ? stateFn() : {});
  }
  if (req.method === 'POST' && url.pathname === '/cmd') {
    const body = await readBody(req);
    const allowed = ['next', 'prev', 'blank', 'logo', 'verse'];
    if (!allowed.includes(body.cmd)) return send(res, 400, { success: false, error: 'Unknown command' });
    try {
      const result = await handler({ cmd: body.cmd, ref: String(body.ref || '').slice(0, 80) });
      return send(res, 200, result || { success: true });
    } catch (e) {
      return send(res, 200, { success: false, error: e.message });
    }
  }
  send(res, 404, 'Not found', 'text/plain');
}

async function start(onCommand, getState) {
  if (server) await stop();
  handler = onCommand;
  stateFn = getState;
  token = crypto.randomBytes(12).toString('hex');
  const ip = lanAddress();
  if (!ip) throw new Error('Not connected to Wi-Fi or a network. Connect this computer to the church Wi-Fi first.');
  await new Promise((resolve, reject) => {
    const s = http.createServer(onRequest);
    s.once('error', reject);
    s.listen(0, '0.0.0.0', () => { server = s; port = s.address().port; resolve(); });
  });
  const url = `http://${ip}:${port}/?t=${token}`;
  const qr = await QRCode.toDataURL(url, { width: 280, margin: 1 });
  return { url, qr };
}

function stop() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    const s = server;
    server = null;
    s.close(() => resolve());
    if (s.closeAllConnections) s.closeAllConnections();
  });
}

function isRunning() { return !!server; }

module.exports = { start, stop, isRunning };
