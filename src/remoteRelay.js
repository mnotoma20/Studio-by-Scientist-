// Phone Remote relay: the app connects OUT to the admin server (so church Wi-Fi rules never block it)
// and the phone talks to the same server. About once a second we publish what is on screen and pick
// up any buttons the phone pressed.
const QRCode = require('qrcode');

let timer = null;
let session = null;
let results = [];
let running = false;
let cfg = null;

async function tick() {
  if (!session) return;
  const mine = session;
  let resp;
  try {
    resp = await cfg.post('/api/remote/poll', { session: mine, state: cfg.getState(), results });
  } catch (_) { resp = null; }   // brief network drop: keep trying
  if (session !== mine) return;
  if (resp && resp._status === 404) { session = null; return; }   // ended elsewhere
  let ranCommands = false;
  if (resp && resp._status === 200) {
    results = [];
    for (const c of resp.commands || []) {
      let result;
      try { result = await cfg.onCommand({ cmd: c.cmd, ref: c.ref || '' }); }
      catch (e) { result = { success: false, error: e.message }; }
      results.push({ id: c.id, result: result || { success: true } });
      ranCommands = true;
    }
  }
  if (session === mine) timer = setTimeout(tick, ranCommands ? 50 : 700);   // deliver results straight away
}

async function start(options) {
  await stop();
  cfg = options;
  const r = await cfg.post('/api/remote/session', {});
  if (r._status !== 200 || !r.session) {
    const err = new Error(r.error || `Could not start the remote (${r._status})`);
    err.upgradeRequired = !!r.upgradeRequired;
    throw err;
  }
  session = r.session;
  results = [];
  running = true;
  const url = `${cfg.baseUrl}/remote.html?s=${session}`;
  const qr = await QRCode.toDataURL(url, { width: 280, margin: 2 });
  tick();
  return { url, qr };
}

async function stop() {
  clearTimeout(timer);
  const had = session;
  session = null;
  running = false;
  if (had && cfg) { try { await cfg.post('/api/remote/stop', {}); } catch (_) { /* best effort */ } }
}

module.exports = { start, stop, isRunning: () => !!session };
