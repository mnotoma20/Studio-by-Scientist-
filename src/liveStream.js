'use strict';
// Live (streaming) speech-to-text for Live Mode. The control window captures the mic as 24 kHz
// PCM and sends it here in ~100 ms pieces; this keeps one WebSocket open to OpenAI's realtime
// transcription service and sends back each word the moment it is recognised. Lives in the main
// process so the short-lived token and the Authorization header never touch the page.

const WebSocket = require('ws');

const URL = 'wss://api.openai.com/v1/realtime?intent=transcription';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function createLiveStream({ getToken, onEvent }) {
  let ws = null;
  let active = false;
  let reconnecting = false;

  function handle(raw) {
    let e;
    try { e = JSON.parse(raw.toString()); } catch { return; }
    if (e.type === 'conversation.item.input_audio_transcription.delta') onEvent({ type: 'delta', text: e.delta || '' });
    else if (e.type === 'conversation.item.input_audio_transcription.completed') onEvent({ type: 'completed', text: e.transcript || '' });
    else if (e.type === 'error') onEvent({ type: 'error', message: (e.error && e.error.message) || 'Transcription error' });
  }

  async function open() {
    const token = await getToken();
    await new Promise((resolve, reject) => {
      const sock = new WebSocket(URL, { headers: { Authorization: `Bearer ${token}` } });
      let opened = false;
      sock.on('open', () => { opened = true; ws = sock; resolve(); });
      sock.on('message', handle);
      sock.on('error', (err) => { if (!opened) reject(err); else onEvent({ type: 'error', message: err.message }); });
      sock.on('close', () => {
        if (ws === sock) ws = null;
        if (active && opened) reconnect();
      });
    });
  }

  // Sessions have a maximum length and networks drop; keep the service going without the operator
  // noticing. Audio sent during the gap is lost (a couple of seconds at worst).
  async function reconnect() {
    if (reconnecting) return;
    reconnecting = true;
    onEvent({ type: 'reconnecting' });
    for (let attempt = 1; active && !ws && attempt <= 8; attempt++) {
      await sleep(Math.min(500 * attempt, 4000));
      if (!active) break;
      try { await open(); onEvent({ type: 'reconnected' }); } catch { /* try again */ }
    }
    reconnecting = false;
    if (active && !ws) onEvent({ type: 'closed', message: 'Lost connection to the live transcription service' });
  }

  return {
    async start() { active = true; try { await open(); } catch (err) { active = false; throw err; } },
    sendAudio(buf) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: Buffer.from(buf).toString('base64') }));
      }
    },
    stop() { active = false; if (ws) { try { ws.close(); } catch { /* already closed */ } ws = null; } },
    isOpen() { return !!ws; }
  };
}

// Wires the above to the control window: start / audio in / stop, events out.
function registerLiveStreamIpc({ ipcMain, getWindow, getToken }) {
  let live = null;
  const emit = (ev) => { const w = getWindow(); if (w && !w.isDestroyed()) w.webContents.send('live-stream-event', ev); };

  ipcMain.handle('live-stream-start', async () => {
    try {
      if (live) live.stop();
      live = createLiveStream({ getToken, onEvent: emit });
      await live.start();
      return { success: true };
    } catch (err) {
      live = null;
      return { success: false, error: err.message, upgradeRequired: !!err.upgradeRequired };
    }
  });
  ipcMain.on('live-stream-audio', (_e, buf) => { if (live) live.sendAudio(buf); });
  ipcMain.handle('live-stream-stop', () => { if (live) live.stop(); live = null; return { success: true }; });
}

module.exports = { createLiveStream, registerLiveStreamIpc };
