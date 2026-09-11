const path = require('path');
const { app, BrowserWindow, ipcMain, screen, shell, dialog } = require('electron');
const fs = require('fs');
const os = require('os');
const { execFile, execSync } = require('child_process');
// Dev-only convenience (e.g. ADMIN_BASE_URL override) — no API keys live here anymore, so
// .env is never bundled into the packaged app. dotenv silently no-ops if the file is absent.
if (!app.isPackaged) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}
const Store = require('electron-store');
const store = new Store();
let autoUpdater;
let log;

let authWindow;
let controlWindow;
let displayWindow; // backward-compat pointer to first enabled non-stage window
let displayWindows = []; // array of { window, config, screenIndex }
let screenConfigs = [];
let splashWindow;
let currentUser = null;
let currentChurch = null;

const appIcon = path.join(__dirname, '..', 'assets',
  process.platform === 'win32' ? 'logo.ico'
  : process.platform === 'darwin' ? 'logo.icns'
  : 'logo.png'
);

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 380,
    height: 420,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    skipTaskbar: true,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  splashWindow.loadFile(path.join(__dirname, 'screens', 'splash.html'));
  splashWindow.on('closed', () => { splashWindow = null; });
}

// Supabase will be imported dynamically when needed
let supabase;
let auth;

function initializeSupabase() {
  try {
    const { supabase: sb, auth: a } = require('./supabaseConfig');
    supabase = sb;
    auth = a;
    console.log('✅ Supabase initialized');
  } catch (error) {
    console.error('❌ Supabase initialization error:', error);
    console.log('⚠️  Make sure to install: npm install @supabase/supabase-js');
    console.log('⚠️  And configure your Supabase credentials in supabaseConfig.js');
  }
}

// Check if user is already logged in
async function checkAuth() {
  console.log('🔍 Checking authentication...');
  
  // Check stored session
  const savedSession = store.get('userSession');
  
  if (savedSession && auth) {
    console.log('📝 Found saved session');
    const result = await auth.getCurrentUser();
    
    if (result.success && result.user) {
      currentUser = result.user;
      currentChurch = result.church;
      console.log('✅ User authenticated:', currentUser.email);
      console.log('🏛️  Church:', currentChurch.name);
      trackEvent('session_start', { church_name: currentChurch.name });
      return true;
    }
  }
  
  console.log('❌ No valid session found');
  return false;
}

// Desktop apps have no inbound endpoint for Stripe's webhook to push into, so plan changes
// are picked up on refresh-on-signal (app launch, window focus, this handler) rather than
// pushed live. Re-runs the same church lookup checkAuth() does, then re-sends 'user-data' so
// the renderer's window._userData.church.plan updates without a full app restart.
ipcMain.handle('refresh-church', async () => {
  if (!auth || !currentUser) return { success: false, error: 'Not signed in' };
  try {
    const result = await auth.getCurrentUser();
    if (result.success && result.church) {
      currentChurch = result.church;
      if (controlWindow) {
        controlWindow.webContents.send('user-data', { user: currentUser, church: currentChurch });
      }
      return { success: true, church: currentChurch };
    }
    return { success: false, error: result.error || 'Could not refresh church' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

function adminBaseUrl() {
  return process.env.ADMIN_BASE_URL || 'https://admin-neon-three-38.vercel.app';
}

// The Supabase access token for the signed-in user — sent to the admin backend as a bearer
// token so it can authenticate this app without any shared secret shipping in the bundle.
async function getAccessToken() {
  try {
    const session = auth && (await auth.getSession());
    return session?.access_token || null;
  } catch (err) {
    console.error('getAccessToken failed:', err.message);
    return null;
  }
}

// POST JSON to an admin backend route with the user's bearer token. Returns the parsed body
// plus `_status`; callers decide what a non-2xx means for them.
async function adminPost(routePath, body) {
  const token = await getAccessToken();
  if (!token) return { _status: 401, error: 'Not signed in' };
  const res = await fetch(`${adminBaseUrl()}${routePath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body || {}),
  });
  let data = {};
  try { data = await res.json(); } catch { /* non-JSON error body */ }
  return { _status: res.status, ...data };
}

// Backend AI proxies — the OpenAI / Anthropic keys live only on the admin server now.
async function aiOpenAI(payload) {
  return adminPost('/api/ai/openai', payload);
}
async function aiAnthropic(payload) {
  return adminPost('/api/ai/anthropic', payload);
}

ipcMain.handle('open-upgrade-flow', async (_event, { plan, interval }) => {
  if (!currentChurch?.id) return { success: false, error: 'Not signed in' };
  try {
    const r = await adminPost('/api/stripe/checkout', { plan, interval });
    if (r._status >= 200 && r._status < 300 && r.url) {
      await shell.openExternal(r.url);
      return { success: true };
    }
    return { success: false, error: r.error || `Checkout failed (${r._status})` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-billing-portal', async () => {
  if (!currentChurch?.id) return { success: false, error: 'Not signed in' };
  try {
    const r = await adminPost('/api/stripe/portal', {});
    if (r._status >= 200 && r._status < 300 && r.url) {
      await shell.openExternal(r.url);
      return { success: true };
    }
    return { success: false, error: r.error || `Could not open billing portal (${r._status})` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Create auth window (sign in or sign up)
function createAuthWindow(page = 'signin') {
  console.log(`🔐 Creating ${page} window...`);
  
  authWindow = new BrowserWindow({
    width: 600,
    height: 800,
    title: page === 'signin' ? 'Sign In' : 'Sign Up',
    backgroundColor: '#1a1a2e',
    show: false,
    resizable: false,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  const htmlPath = path.join(__dirname, 'screens', `${page}.html`);
  console.log('📄 Trying to load:', htmlPath);  // ← ADD THIS
  
  authWindow.loadFile(htmlPath).then(() => {  // ← ADD .then()
    console.log('✅ Auth screen loaded successfully!');
  }).catch(err => {  // ← ADD .catch()
    console.error('❌ Failed to load auth screen:', err);
    console.error('❌ Path was:', htmlPath);
  });

  authWindow.once('ready-to-show', () => {
    if (authWindow) {  // ← ADD THIS CHECK!
      authWindow.show();
    } else {
      console.error('❌ authWindow is null in ready-to-show!');
    }
  });

  authWindow.on('closed', () => {
    authWindow = null;
  });
}

function setupAutoUpdater() {
  ({ autoUpdater } = require('electron-updater'));
  log = require('electron-log');

  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    if (controlWindow && !controlWindow.isDestroyed()) {
      controlWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (controlWindow && !controlWindow.isDestroyed()) {
      controlWindow.webContents.send('update-progress', progress);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    if (controlWindow && !controlWindow.isDestroyed()) {
      controlWindow.webContents.send('update-downloaded', info);
    }
  });

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err);
  });

  autoUpdater.checkForUpdatesAndNotify().catch(err => log.warn('Update check failed:', err.message));
}

ipcMain.handle('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify().catch(err => log.warn('Manual update check failed:', err.message));
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('open-external', (_event, url) => {
  shell.openExternal(url);
});

// Create main app windows
function createAppWindows() {
  console.log('🚀 Creating app windows...');
  
  // Control Window
  controlWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    x: 50,
    y: 50,
    title: `Studio Control - ${currentChurch ? currentChurch.name : 'Studio by Scientist'}`,
    backgroundColor: '#1a1a2e',
    show: false,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  const controlPath = path.join(__dirname, 'control.html');
  controlWindow.loadFile(controlPath);

  controlWindow.once('ready-to-show', () => {
    controlWindow.show();
    controlWindow.webContents.openDevTools();

    // Send user and church data to control window
    controlWindow.webContents.send('user-data', {
      user: currentUser,
      church: currentChurch
    });

    setupAutoUpdater();
  });

  createDisplayWindows();

  // Refresh plan on window focus (upgrade in browser → alt-tab back → already unlocked),
  // debounced so rapid focus events don't spam the DB. Safety-net interval covers always-on
  // control-room setups that never lose window focus.
  let lastChurchRefresh = 0;
  const refreshChurchIfStale = async () => {
    if (Date.now() - lastChurchRefresh < 60 * 1000) return;
    lastChurchRefresh = Date.now();
    if (!auth || !currentUser) return;
    try {
      const result = await auth.getCurrentUser();
      if (result.success && result.church) {
        currentChurch = result.church;
        if (controlWindow) controlWindow.webContents.send('user-data', { user: currentUser, church: currentChurch });
      }
    } catch (err) {
      console.error('Background church refresh failed:', err.message);
    }
  };
  controlWindow.on('focus', refreshChurchIfStale);
  setInterval(refreshChurchIfStale, 10 * 60 * 1000);

  controlWindow.on('closed', () => {
    closeAllDisplayWindows();
    controlWindow = null;
  });
}

// ============================================
// MULTI-SCREEN SYSTEM
// ============================================

function getAvailableDisplays() {
  return screen.getAllDisplays().map(d => ({
    id: d.id,
    label: d.label || `Display ${d.id}`,
    bounds: d.bounds,
    isPrimary: d.bounds.x === 0 && d.bounds.y === 0
  }));
}

function getDefaultScreenConfigs() {
  return [
    { screen_index: 0, screen_name: 'Stage Monitor',      enabled: false, content_profile: 'stage',      display_id: null },
    { screen_index: 1, screen_name: 'Main Congregation',  enabled: true,  content_profile: 'clean',      display_id: null },
    { screen_index: 2, screen_name: 'Overflow',           enabled: false, content_profile: 'mirror:1',   display_id: null },
    { screen_index: 3, screen_name: 'NDI Output',         enabled: false, content_profile: 'clean',      ndi_enabled: true, ndi_name: 'Studio by Scientist' },
    { screen_index: 4, screen_name: 'Stage Display',      enabled: false, content_profile: 'confidence', display_id: null },
  ];
}

// show_timer is stored locally (per machine), not in Supabase — display/timer
// preferences belong to the physical setup, and this avoids a schema change.
function applyStoredTimers(configs) {
  const timers = store.get('screenTimers', {});
  for (const c of configs) {
    const v = timers[c.screen_index];
    c.show_timer = (v === false) ? false : true;
  }
  return configs;
}

async function loadScreenConfigs() {
  try {
    const { data } = await supabase
      .from('screen_configs')
      .select('*')
      .order('screen_index', { ascending: true });
    if (data?.length) {
      // Merge: keep saved rows, fill in any new default screens (e.g. screen_index 4)
      const defaults = getDefaultScreenConfigs();
      screenConfigs = defaults.map(def => data.find(d => d.screen_index === def.screen_index) || def);
    } else {
      screenConfigs = getDefaultScreenConfigs();
    }
  } catch (e) {
    screenConfigs = getDefaultScreenConfigs();
  }
  applyStoredTimers(screenConfigs);
}

async function createDisplayWindows() {
  await loadScreenConfigs();
  const displays = getAvailableDisplays();
  displayWindows = [];
  displayWindow = null;

  for (const config of screenConfigs) {
    if (!config.enabled) continue;
    if (config.ndi_enabled) continue; // NDI handled separately

    let targetDisplay = displays.find(d => d.id === config.display_id);
    if (!targetDisplay) {
      // auto-assign: main congregation prefers external, stage/overflow get primary
      targetDisplay = (config.screen_index === 1 && displays.length > 1)
        ? displays.find(d => !d.isPrimary) || displays[0]
        : displays[0];
    }

    const win = new BrowserWindow({
      x: targetDisplay.bounds.x,
      y: targetDisplay.bounds.y,
      width: targetDisplay.bounds.width,
      height: targetDisplay.bounds.height,
      title: 'Studio Display',
      backgroundColor: '#000000',
      show: false,
      icon: appIcon,
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    const rendererFile = config.content_profile === 'confidence' ? 'stage.html' : 'display.html';
    win.loadFile(path.join(__dirname, rendererFile), {
      query: {
        profile: config.content_profile,
        screenIndex: config.screen_index.toString(),
        screenName: config.screen_name
      }
    });

    win.webContents.once('did-finish-load', async () => {
      try {
        const { data } = await supabase
          .from('church_settings')
          .select('logo_url, watermark_position, timer_position')
          .limit(1).single();
        if (data?.logo_url) {
          win.webContents.send('show-logo-watermark', { url: data.logo_url, position: data.watermark_position || 'bottom-left' });
        }
        if (data?.timer_position) {
          win.webContents.send('set-timer-position', data.timer_position);
        }
      } catch (e) {}
    });

    win.on('closed', () => {
      displayWindows = displayWindows.filter(d => d.screenIndex !== config.screen_index);
      // keep backward-compat pointer current
      displayWindow = displayWindows.find(d =>
        d.config.content_profile !== 'stage' &&
        d.config.content_profile !== 'confidence' &&
        !d.config.ndi_enabled
      )?.window || null;
    });

    displayWindows.push({ window: win, config, screenIndex: config.screen_index });

    // backward compat — first enabled non-stage, non-confidence window
    if (!displayWindow && config.content_profile !== 'stage' && config.content_profile !== 'confidence') {
      displayWindow = win;
    }
  }
}

// Broadcast a message to all display windows (or just those matching a profile)
function broadcastToDisplays(channel, data, profileFilter = null) {
  for (const { window: win, config } of displayWindows) {
    if (!win || win.isDestroyed()) continue;
    if (profileFilter && config.content_profile !== profileFilter) continue;
    win.webContents.send(channel, data);
  }
}

// Show all display windows fullscreen on their assigned physical displays
function showAllDisplayWindows() {
  for (const { window: win } of displayWindows) {
    if (!win || win.isDestroyed()) continue;
    win.show();
    win.setFullScreen(true);
  }
}

function hideAllDisplayWindows() {
  for (const { window: win } of displayWindows) {
    if (!win || win.isDestroyed()) continue;
    win.setFullScreen(false);
    win.hide();
  }
}

function closeAllDisplayWindows() {
  for (const { window: win } of displayWindows) {
    if (!win || win.isDestroyed()) continue;
    win.close();
  }
  displayWindows = [];
  displayWindow = null;
}

// IPC Handlers for Authentication

// Sign Up
ipcMain.on('auth-signup', async (event, data) => {
  console.log('📝 Sign up attempt:', data.email);
  
  if (!auth) {
    event.reply('auth-signup-response', {
      success: false,
      error: 'Supabase not configured'
    });
    return;
  }

  const result = await auth.signUp(data.email, data.password, data.churchData);
  
  if (result.success) {
    currentUser = result.user;
    // DON'T save session yet - wait for OTP verification
    console.log('✅ Sign up successful! Check email for OTP.');
  }
  
  event.reply('auth-signup-response', result);
});

// Sign In
ipcMain.on('auth-signin', async (event, data) => {
  console.log('🔐 Sign in attempt:', data.email);
  
  if (!auth) {
    event.reply('auth-signin-response', {
      success: false,
      error: 'Supabase not configured. Please check supabaseConfig.js'
    });
    return;
  }

  const result = await auth.signIn(data.email, data.password);
  
  if (result.success) {
    currentUser = result.user;
    currentChurch = result.church;
    
    // Store session if remember me
    if (data.rememberMe) {
      store.set('userSession', {
        userId: result.user.id,
        email: result.user.email,
        churchId: result.church.id
      });
      store.set('rememberedEmail', data.email);
    }
    
    console.log('✅ Sign in successful!');
  }
  
  event.reply('auth-signin-response', result);
});

// Auth complete - open main app
ipcMain.on('auth-complete', () => {
  console.log('🎉 Auth complete! Opening main app...');
  
  if (authWindow) {
    authWindow.close();
    authWindow = null;
  }
  
  createAppWindows();
});

ipcMain.on('go-to-signup', () => {
  if (authWindow) {
    const htmlPath = path.join(__dirname, 'screens', 'signup.html');
    authWindow.loadFile(htmlPath);
  } else {
    createAuthWindow('signup');
  }
});

ipcMain.on('go-to-signin', () => {
  if (authWindow) {
    const htmlPath = path.join(__dirname, 'screens', 'signin.html');
    authWindow.loadFile(htmlPath);
  } else {
    createAuthWindow('signin');
  }
});

// Sign out
ipcMain.on('auth-signout', async () => {
  console.log('👋 Signing out...');
  
  if (auth) {
    await auth.signOut();
  }
  
  // Clear stored session
  store.delete('userSession');
  
  currentUser = null;
  currentChurch = null;
  
  // Close app windows
  if (controlWindow) controlWindow.close();
  closeAllDisplayWindows();
  
  // Show auth window
  createAuthWindow('signin');
});

// OTP Verification
ipcMain.on('auth-verify-otp', async (event, data) => {
  console.log('🔐 Verifying OTP for:', data.email);
  
  if (!auth) {
    event.reply('auth-verify-otp-response', {
      success: false,
      error: 'Supabase not configured'
    });
    return;
  }

  const result = await auth.verifyOTP(data.email, data.token, data.type);
  
  if (result.success) {
    currentUser = result.user;
    currentChurch = result.church;
    
    store.set('userSession', {
      userId: result.user.id,
      email: result.user.email,
      churchId: result.church?.id
    });
    
    console.log('✅ OTP verified!');
  }
  
  event.reply('auth-verify-otp-response', result);
});

// Resend OTP
ipcMain.on('auth-resend-otp', async (event, data) => {
  console.log('📧 Resending OTP to:', data.email);
  
  if (!auth) {
    return;
  }

  await auth.resendOTP(data.email);
});

// ============================================
// ANALYTICS TRACKING (fire-and-forget)
// ============================================

function trackEvent(event, data = {}) {
  if (!currentUser) return;
  const payload = {
    user_id: currentUser.id,
    church_id: currentChurch?.id || null,
    event,
    data,
    created_at: new Date().toISOString()
  };
  supabase.from('analytics_events').insert(payload).then(({ error }) => {
    if (error) console.warn('[analytics] track error:', error.message);
  });
}

// ============================================
// IPC Handlers for Bible Display
// ============================================
ipcMain.on('display-verse', (event, verseData) => {
  console.log('📺 Display verse:', verseData.ref || verseData.reference);
  broadcastToDisplays('show-verse', verseData);
  broadcastToDisplays('item-went-live', { startedAt: Date.now() }, 'confidence');
  trackEvent('verse_displayed', { reference: verseData.reference || verseData.ref, translation: verseData.translation });
});

ipcMain.on('clear-screen', () => {
  console.log('🧹 Clear display');
  broadcastToDisplays('clear-display', null);
});

ipcMain.handle('go-live', () => {
  if (displayWindows.length === 0) return { success: false, error: 'No display screens configured and enabled' };
  showAllDisplayWindows();
  return { success: true, screens: displayWindows.length };
});

ipcMain.handle('end-live', () => {
  hideAllDisplayWindows();
});

// ============================================
// SONGS HANDLERS
// ============================================

// Get all songs
ipcMain.handle('get-songs', async () => {
  try {
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .order('title', { ascending: true });

    if (error) throw error;
    return { success: true, songs: songs || [] };
  } catch (error) {
    console.error('Error getting songs:', error);
    return { success: false, error: error.message, songs: [] };
  }
});

// Save song
ipcMain.handle('save-song', async (event, song) => {
  try {
    if (song.id) {
      const { data, error } = await supabase
        .from('songs')
        .update({
          title: song.title,
          author: song.author,
          sections: song.sections,
          updated_at: new Date().toISOString()
        })
        .eq('id', song.id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, song: data };
    } else {
      const { data, error } = await supabase
        .from('songs')
        .insert([{
          title: song.title,
          author: song.author,
          sections: song.sections
        }])
        .select()
        .single();
      if (error) throw error;
      return { success: true, song: data };
    }
  } catch (error) {
    console.error('Error saving song:', error);
    return { success: false, error: error.message };
  }
});

// Delete song
ipcMain.handle('delete-song', async (event, songId) => {
  try {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting song:', error);
    return { success: false, error: error.message };
  }
});

// Display lyrics
ipcMain.on('display-lyrics', (event, lyricsData) => {
  console.log('📺 Displaying lyrics:', lyricsData.title);
  broadcastToDisplays('show-lyrics', lyricsData);
  broadcastToDisplays('item-went-live', { startedAt: Date.now() }, 'confidence');
  trackEvent('song_displayed', { title: lyricsData.title, author: lyricsData.author });
});


// App ready
app.whenReady().then(async () => {
  console.log('✅ Electron app ready!');
  console.log('🖼️ App icon path:', appIcon);

  // Set macOS dock icon explicitly — dock.setIcon requires PNG, not .icns
  // Wrapped in try-catch so any icon error cannot prevent Supabase from initializing
  try {
    if (process.platform === 'darwin' && app.dock) {
      app.dock.setIcon(path.join(__dirname, '..', 'assets', 'logo.png'));
      console.log('✅ Dock icon set');
    }
  } catch (e) {
    console.warn('⚠️ Could not set dock icon:', e.message);
  }

  createSplashWindow();
  initializeSupabase();
  initNDI();

  const [isAuthenticated] = await Promise.all([
    checkAuth(),
    new Promise(resolve => setTimeout(resolve, 1800))
  ]);

  if (splashWindow) splashWindow.close();

  if (isAuthenticated) {
    createAppWindows();
  } else {
    createAuthWindow('signin');
  }
});

app.on('window-all-closed', () => {
  console.log('🛑 All windows closed');
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    checkAuth().then(isAuth => {
      if (isAuth) {
        createAppWindows();
      } else {
        createAuthWindow('signin');
      }
    });
  }
});

// ============================================
// THEMES HANDLERS (Add to main.js)
// ============================================

// Get all themes
ipcMain.handle('get-themes', async () => {
  try {
    const { data: themes, error } = await supabase
      .from('themes')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, themes: themes || [] };
  } catch (error) {
    console.error('Error getting themes:', error);
    return { success: false, error: error.message, themes: [] };
  }
});

// Save theme (create or update)
ipcMain.handle('save-theme', async (event, theme) => {
  try {
    if (theme.id) {
      // Update existing
      const { data, error } = await supabase
        .from('themes')
        .update({
          name: theme.name,
          type: theme.type,
          background_url: theme.background_url,
          text_color: theme.text_color,
          title_color: theme.title_color,
          font_size: theme.font_size,
          overlay_opacity: theme.overlay_opacity
        })
        .eq('id', theme.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, theme: data };
    } else {
      // Create new
      const { data, error } = await supabase
        .from('themes')
        .insert([{
          name: theme.name,
          type: theme.type,
          background_url: theme.background_url,
          text_color: theme.text_color,
          title_color: theme.title_color,
          font_size: theme.font_size,
          overlay_opacity: theme.overlay_opacity
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, theme: data };
    }
  } catch (error) {
    console.error('Error saving theme:', error);
    return { success: false, error: error.message };
  }
});

// Delete theme
ipcMain.handle('delete-theme', async (event, themeId) => {
  try {
    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', themeId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting theme:', error);
    return { success: false, error: error.message };
  }
});

// Apply theme to display window
ipcMain.on('apply-theme', (event, themeData) => {
  console.log('🎨 Applying theme:', themeData);
  broadcastToDisplays('apply-theme', themeData);
});

// ============================================
// BACKGROUNDS HANDLERS
// ============================================

ipcMain.handle('get-backgrounds', async () => {
  try {
    const { data, error } = await supabase
      .from('backgrounds')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, backgrounds: data || [] };
  } catch (error) {
    console.error('Error getting backgrounds:', error);
    return { success: false, error: error.message, backgrounds: [] };
  }
});

ipcMain.handle('save-background', async (event, bg) => {
  try {
    const { data, error } = await supabase
      .from('backgrounds')
      .insert([bg])
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, background: data };
  } catch (error) {
    console.error('Error saving background:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-logo-background', async (event, bgId) => {
  try {
    await supabase.from('backgrounds').update({ is_logo: false }).eq('is_logo', true);
    const { error } = await supabase.from('backgrounds').update({ is_logo: true }).eq('id', bgId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error setting logo:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-background', async (event, bgId) => {
  try {
    const { error } = await supabase.from('backgrounds').delete().eq('id', bgId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting background:', error);
    return { success: false, error: error.message };
  }
});

// ─── SLIDE DECKS HANDLERS ───────────────────────────────────────────────────
// Library list — full rows (matches the "songs"/select('*') convention) so cards can
// render a real thumbnail of each deck's first page, not just a placeholder icon.
ipcMain.handle('get-slide-decks', async () => {
  try {
    const { data, error } = await supabase
      .from('slide_decks')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return { success: true, decks: data || [] };
  } catch (error) {
    console.error('Error getting slide decks:', error);
    return { success: false, error: error.message, decks: [] };
  }
});

// Full row (including pages) — used to open the editor or resolve a deck for Schedule
ipcMain.handle('get-slide-deck', async (event, deckId) => {
  try {
    const { data, error } = await supabase
      .from('slide_decks')
      .select('*')
      .eq('id', deckId)
      .single();
    if (error) throw error;
    return { success: true, deck: data };
  } catch (error) {
    console.error('Error getting slide deck:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-slide-deck', async (event, deck) => {
  try {
    if (deck.id) {
      const { data, error } = await supabase
        .from('slide_decks')
        .update({
          title: deck.title,
          pages: deck.pages,
          page_w: deck.page_w,
          page_h: deck.page_h,
          theme: deck.theme || 'modern',
          updated_at: new Date().toISOString()
        })
        .eq('id', deck.id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, deck: data };
    } else {
      const gate = isFeatureAllowed('slideDeckCreate');
      if (!gate.allowed) return gate;
      const { data, error } = await supabase
        .from('slide_decks')
        .insert([{
          title: deck.title,
          pages: deck.pages,
          page_w: deck.page_w || 1920,
          page_h: deck.page_h || 1080,
          theme: deck.theme || 'modern'
        }])
        .select()
        .single();
      if (error) throw error;
      return { success: true, deck: data };
    }
  } catch (error) {
    console.error('Error saving slide deck:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-slide-deck', async (event, deckId) => {
  try {
    const { error } = await supabase.from('slide_decks').delete().eq('id', deckId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting slide deck:', error);
    return { success: false, error: error.message };
  }
});

// Live-display a single deck page on the projector (fire-and-forget, same convention as display-pptx-slide)
ipcMain.on('display-slide-deck-page', (_event, page) => {
  console.log('🎬 Displaying slide deck page:', page?.id);
  broadcastToDisplays('show-slide-deck-page', page);
  broadcastToDisplays('item-went-live', { startedAt: Date.now() }, 'confidence');
});

ipcMain.on('start-countdown', (event, seconds) => {
  // Only show the schedule countdown on screens that have the timer enabled
  for (const { window: win, config } of displayWindows) {
    if (!win || win.isDestroyed()) continue;
    if (config.show_timer === false) continue;
    win.webContents.send('start-countdown', seconds);
  }
});

ipcMain.on('stop-countdown', () => {
  broadcastToDisplays('stop-countdown', null);
});

ipcMain.on('display-background', (event, imageUrl) => {
  console.log('🖼️ Displaying background on projector');
  broadcastToDisplays('show-background', imageUrl);
  broadcastToDisplays('item-went-live', { startedAt: Date.now() }, 'confidence');
});

ipcMain.on('display-pptx-slide', (_event, slide) => {
  broadcastToDisplays('show-pptx-slide', slide);
  broadcastToDisplays('item-went-live', { startedAt: Date.now() }, 'confidence');
  trackEvent('slide_displayed', { title: slide.text?.slice(0, 60) || 'PPTX slide' });
});

ipcMain.on('display-prayer-combined', (_event, data) => {
  console.log('🙏 Displaying prayer combined on projector');
  broadcastToDisplays('show-prayer-combined', data);
  broadcastToDisplays('item-went-live', { startedAt: Date.now() }, 'confidence');
  trackEvent('prayer_displayed', { title: data.title });
});

ipcMain.on('update-font-size', (_event, size) => {
  broadcastToDisplays('update-font-size', size);
});

ipcMain.on('update-text-stroke', (_event, px) => {
  broadcastToDisplays('update-text-stroke', px);
});

ipcMain.on('set-song-title-visibility', (_event, visible) => {
  broadcastToDisplays('set-song-title-visibility', visible);
});

// ============================================
// PLAN GATING (Free vs Pro/Studio)
// ============================================
// Main process is the real enforcement boundary — this app runs with nodeIntegration:true
// and no contextIsolation, so any renderer-side check alone would be trivially bypassable
// via devtools. Renderer-side checks elsewhere are UX polish only, never the actual gate.
const FEATURE_PLAN = {
  pptxImport: 'paid',
  slideDeckCreate: 'paid',
  liveModeAI: 'paid',
  sermonNotesAI: 'paid',
  weeklyTeachingAI: 'paid',
};

// Owner / admin override — the church owner gets every paid feature regardless of plan.
// Keyed off the churches.is_admin flag, with an email allowlist fallback so it works even
// before that flag is set in the database.
const OWNER_EMAILS = ['oghenemine2007@outlook.com'];
function isOwner() {
  if (currentChurch && currentChurch.is_admin === true) return true;
  const email = (currentUser?.email || '').toLowerCase();
  return OWNER_EMAILS.includes(email);
}

function isFeatureAllowed(featureKey) {
  if (FEATURE_PLAN[featureKey] !== 'paid') return { allowed: true };
  if (isOwner()) return { allowed: true };
  const plan = (currentChurch?.plan || 'free').toLowerCase();
  if (plan === 'pro' || plan === 'studio') return { allowed: true };
  return { success: false, allowed: false, error: 'This feature requires a Pro or Studio plan.', upgradeRequired: true, feature: featureKey };
}

async function checkScheduleQuota() {
  if (isOwner()) return { allowed: true };
  if ((currentChurch?.plan || 'free').toLowerCase() !== 'free') return { allowed: true };
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from('schedules')
      .select('id', { count: 'exact', head: true })
      .eq('church_id', currentChurch?.id || null)
      .gte('created_at', start.toISOString());
    if (error) throw error;
    if ((count || 0) >= 2) {
      return { success: false, allowed: false, error: 'Free plan is limited to 2 schedules per month. Upgrade to Pro for unlimited schedules.', upgradeRequired: true, feature: 'scheduleCreate' };
    }
    return { allowed: true };
  } catch (err) {
    console.error('Schedule quota check failed, allowing (fail-open):', err.message);
    return { allowed: true };
  }
}

// ============================================
// SCHEDULE HANDLERS
// ============================================

ipcMain.handle('get-schedules', async () => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('church_id', currentChurch?.id || null)
      .order('service_date', { ascending: false });
    if (error) throw error;
    return { success: true, schedules: data || [] };
  } catch (error) {
    return { success: false, error: error.message, schedules: [] };
  }
});

ipcMain.handle('create-schedule', async (event, schedule) => {
  try {
    const gate = await checkScheduleQuota();
    if (!gate.allowed) return gate;
    const { data, error } = await supabase
      .from('schedules')
      .insert([{ title: schedule.title, service_date: schedule.service_date, service_type: schedule.service_type, church_id: currentChurch?.id || null }])
      .select()
      .single();
    if (error) throw error;
    return { success: true, schedule: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-schedule', async (event, schedule) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .update({ title: schedule.title, service_date: schedule.service_date, service_type: schedule.service_type })
      .eq('id', schedule.id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, schedule: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-schedule', async (event, scheduleId) => {
  try {
    await supabase.from('schedule_items').delete().eq('schedule_id', scheduleId);
    const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-schedule-items', async (event, scheduleId) => {
  try {
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('position', { ascending: true });
    if (error) throw error;
    return { success: true, items: data || [] };
  } catch (error) {
    return { success: false, error: error.message, items: [] };
  }
});

ipcMain.handle('save-schedule-item', async (event, item) => {
  try {
    if (item.id) {
      const { data, error } = await supabase
        .from('schedule_items')
        .update({
          title: item.title, type: item.type, content: item.content,
          timestamp_label: item.timestamp_label, notes: item.notes, position: item.position
        })
        .eq('id', item.id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, item: data };
    } else {
      const { data, error } = await supabase
        .from('schedule_items')
        .insert([{
          schedule_id: item.schedule_id, title: item.title, type: item.type,
          content: item.content, timestamp_label: item.timestamp_label,
          notes: item.notes || '', position: item.position
        }])
        .select()
        .single();
      if (error) throw error;
      return { success: true, item: data };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-schedule-item', async (event, itemId) => {
  try {
    const { error } = await supabase.from('schedule_items').delete().eq('id', itemId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reorder-schedule-items', async (event, items) => {
  try {
    await Promise.all(
      items.map(item => supabase.from('schedule_items').update({ position: item.position }).eq('id', item.id))
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// AI HANDLERS
// ============================================

ipcMain.handle('generate-sermon-notes', async (_event, data) => {
  try {
    const gate = isFeatureAllowed('sermonNotesAI');
    if (!gate.allowed) return gate;

    const prompt = `You are a sermon preparation assistant for a Christian church. Generate comprehensive sermon notes based on the following input.

Input: ${data.input}
Type: ${data.type} (scripture reference or topic)
Style: ${data.style || 'evangelical'}

Return a JSON object with this exact structure (no markdown, just raw JSON):
{
  "title": "Sermon title",
  "scripture": "Main scripture reference",
  "scriptureText": "The actual verse text (KJV)",
  "theme": "One sentence theme",
  "points": [
    {
      "number": 1,
      "heading": "Point heading",
      "content": "2-3 sentences expanding on this point",
      "supportingVerse": "Book Chapter:Verse",
      "supportingVerseText": "The verse text (KJV)",
      "illustration": "A brief real-world illustration or story prompt"
    }
  ],
  "closingPrayer": "A 2-3 sentence closing prayer",
  "callToAction": "One sentence call to action for the congregation"
}

Generate 3-5 points. Make it practical, scripture-grounded, and suitable for a modern evangelical church service.`;

    const result = await aiAnthropic({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });
    if (result._status !== 200) {
      if (result.upgradeRequired) return { success: false, error: result.error, upgradeRequired: true };
      return { success: false, error: result.error?.message || result.error || 'Claude API error' };
    }

    const responseText = result.content[0].text;
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { success: true, notes: parsed };
  } catch (error) {
    console.error('Error generating sermon notes:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('transcribe-audio', async (_event, audioBuffer) => {
  try {
    const gate = isFeatureAllowed('liveModeAI');
    if (!gate.allowed) return gate;

    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const result = await aiOpenAI({
      kind: 'transcribe',
      audioBase64,
      mime: 'audio/webm',
      fields: {
        language: 'en',
        response_format: 'verbose_json',
        'timestamp_granularities[]': 'word',
        prompt: 'Genesis Exodus Leviticus Numbers Deuteronomy Joshua Judges Ruth Samuel Kings Chronicles Ezra Nehemiah Esther Job Psalms Proverbs Ecclesiastes Isaiah Jeremiah Lamentations Ezekiel Daniel Hosea Joel Amos Obadiah Jonah Micah Nahum Habakkuk Zephaniah Haggai Zechariah Malachi Matthew Mark Luke John Acts Romans Corinthians Galatians Ephesians Philippians Colossians Thessalonians Timothy Titus Philemon Hebrews James Peter John Jude Revelation chapter verse',
      },
    });
    if (result._status !== 200) {
      if (result.upgradeRequired) return { success: false, error: result.error, upgradeRequired: true };
      return { success: false, error: result.error?.message || result.error || 'Whisper API error' };
    }

    const hallucinations = [
      /thanks for watching[.!]?/gi, /please subscribe[.!]?/gi,
      /like and subscribe[.!]?/gi, /don'?t forget to subscribe[.!]?/gi,
      /subscribe[.!]?/gi, /see you next time[.!]?/gi,
      /bye[- ]?bye[.!]?/gi, /thank you for watching[.!]?/gi,
      /\[music\]/gi, /\[applause\]/gi, /\[laughter\]/gi
    ];
    let text = result.text;
    for (const h of hallucinations) text = text.replace(h, '').trim();
    if (!text) return { success: true, text: '', words: [] };
    // Word-level timestamps (seconds, relative to chunk start) for the operator read-along
    const words = Array.isArray(result.words)
      ? result.words.map(w => ({ word: w.word, start: w.start, end: w.end }))
      : [];
    return { success: true, text, words };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    return { success: false, error: error.message };
  }
});

// Fetch verse only — renderer decides whether to display (used by Live Mode voice detection)
ipcMain.handle('ai-fetch-and-display-passive', async (_event, reference) => {
  try {
    const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) return { success: false, error: data.error };
    return { success: true, verse: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-fetch-and-display', async (event, reference) => {
  try {
    const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) return { success: false, error: data.error };

    broadcastToDisplays('show-verse', { reference: data.reference, text: data.text, translation: 'KJV' });
    trackEvent('ai_detection', { reference: data.reference });

    return { success: true, verse: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Semantic Bible reference detection via GPT-4o-mini
ipcMain.handle('detect-bible-reference', async (_event, data) => {
  try {
    const contextText = data.recentContext
      ? `Previous context: "${data.recentContext}"\nCurrent chunk: "${data.text}"`
      : `"${data.text}"`;

    const prompt = `You are a Bible verse detection system for a live church service. Analyze this sermon transcript chunk and identify any Bible verse being quoted, referenced, or navigated to.

${contextText}

TRANSCRIPTION VARIATIONS TO HANDLE:
- "Nay-hum", "Nayhum", "Nahoom" = Nahum
- "Songs of Solomon", "Song of Songs", "Song of Solomon" = Song of Solomon
- "Obi-diah", "Obediah", "Obadia" = Obadiah
- "Tie-tus", "Titus" = Titus
- "Filly-pians", "Filipians", "Phillipians" = Philippians
- "Deutronomy", "Deu-teronomy" = Deuteronomy
- "Salms", "Sarms", "Psalmos" = Psalms
- "Revelations" = Revelation
- "First/Second/Third" = 1/2/3 (e.g. "First Corinthians" = 1 Corinthians)
- "chapter X verse Y", "X colon Y", "verse Y of chapter X" = Chapter:Verse format

NAVIGATION COMMANDS — if detected, return special format:
- "next verse" / "go to the next verse" → return "NAV:NEXT"
- "previous verse" / "go back" / "last verse" → return "NAV:PREV"
- "verse [number]" / "go to verse [number]" → return "NAV:VERSE:[number]"
- "chapter [number]" / "go to chapter [number]" → return "NAV:CHAPTER:[number]"

DETECTION RULES:
- Detect explicit references: "John 3:16", "Romans 8:28"
- Detect implicit quotes: "for God so loved the world", "thy faith hath made thee whole"
- Detect natural speech: "chapter three verse sixteen", "first Corinthians thirteen four"
- Only return a reference if confidence > 70%
- If multiple verses referenced, return the most prominent one

DETECTION MODE 3 — BIBLE STORY/NARRATIVE:
The preacher is retelling a Bible story in their own words. Track which specific
moment in the story is being described RIGHT NOW and return that exact verse.
Return the verse for the CURRENT MOMENT being narrated, not the start of the story.
Use STORY: prefix for all narrative detections. Confidence threshold: 80%.

OLD TESTAMENT STORIES:

Abraham & Isaac:
- "Abraham took his son Isaac up the mountain to sacrifice him" → STORY:Genesis 22:9
- "Abraham lifted the knife and the angel stopped him" → STORY:Genesis 22:12
- "God will provide a lamb, there in the bushes was a ram" → STORY:Genesis 22:13

Joseph:
- "Joseph's brothers were jealous and threw him in the pit" → STORY:Genesis 37:24
- "they sold Joseph to the Ishmaelites for twenty pieces of silver" → STORY:Genesis 37:28
- "Potiphar's wife grabbed Joseph's garment" → STORY:Genesis 39:12
- "Pharaoh had a dream about seven fat cows and seven thin cows" → STORY:Genesis 41:2
- "Joseph revealed himself to his brothers and wept" → STORY:Genesis 45:1

Moses:
- "Moses saw a burning bush that was not consumed" → STORY:Exodus 3:2
- "God told Moses to remove his sandals for holy ground" → STORY:Exodus 3:5
- "Moses stretched out his rod and the Red Sea parted" → STORY:Exodus 14:21
- "the children of Israel walked through on dry ground" → STORY:Exodus 14:22
- "Pharaoh's army was swallowed up in the sea" → STORY:Exodus 14:28
- "God gave Moses the ten commandments on Mount Sinai" → STORY:Exodus 20:1
- "Moses struck the rock and water came out" → STORY:Numbers 20:11

Joshua/Jericho:
- "the children of Israel marched around Jericho seven days" → STORY:Joshua 6:15
- "when they shouted the walls of Jericho fell flat" → STORY:Joshua 6:20
- "Rahab hid the spies and hung a scarlet thread" → STORY:Joshua 2:18

Gideon:
- "Gideon put out the fleece to test God" → STORY:Judges 6:37
- "God told Gideon the army was too big, reduced to 300" → STORY:Judges 7:7
- "Gideon's 300 men broke the pitchers and held the torches" → STORY:Judges 7:19

Samson:
- "Delilah asked Samson the secret of his strength" → STORY:Judges 16:6
- "they shaved Samson's head while he slept" → STORY:Judges 16:19
- "Samson pushed the pillars and the building collapsed" → STORY:Judges 16:30

Ruth:
- "Ruth said wherever you go I will go, your people shall be my people" → STORY:Ruth 1:16
- "Ruth gleaned in the fields of Boaz" → STORY:Ruth 2:3

Hannah:
- "Hannah wept and prayed bitterly for a child" → STORY:1 Samuel 1:10
- "Hannah made a vow if God gave her a son she would give him back" → STORY:1 Samuel 1:11
- "Eli thought Hannah was drunk but she was praying" → STORY:1 Samuel 1:13

Samuel:
- "Samuel heard a voice calling in the night and thought it was Eli" → STORY:1 Samuel 3:4
- "God told Samuel to speak for your servant hears" → STORY:1 Samuel 3:10

David & Goliath:
- "Goliath stood and challenged the armies of Israel twice a day" → STORY:1 Samuel 17:16
- "Goliath said am I a dog that you come to me with sticks" → STORY:1 Samuel 17:43
- "David said I come to you in the name of the Lord of hosts" → STORY:1 Samuel 17:45
- "David ran toward Goliath and took a stone from his bag" → STORY:1 Samuel 17:48
- "the stone sank into Goliath's forehead and he fell" → STORY:1 Samuel 17:49
- "David cut off Goliath's head with his own sword" → STORY:1 Samuel 17:51

David & Bathsheba:
- "David saw a woman bathing from the rooftop" → STORY:2 Samuel 11:2
- "David sent for Bathsheba and lay with her" → STORY:2 Samuel 11:4
- "David put Uriah at the front of the battle to die" → STORY:2 Samuel 11:15
- "Nathan told David the parable of the poor man's lamb" → STORY:2 Samuel 12:1
- "Nathan said thou art the man" → STORY:2 Samuel 12:7

Elijah:
- "Elijah challenged the prophets of Baal on Mount Carmel" → STORY:1 Kings 18:19
- "Baal's prophets cried out all day but no fire came" → STORY:1 Kings 18:26
- "Elijah repaired the altar and put water on the sacrifice" → STORY:1 Kings 18:33
- "fire fell from heaven and consumed the sacrifice and the water" → STORY:1 Kings 18:38
- "Elijah ran under the juniper tree exhausted and said it is enough" → STORY:1 Kings 19:4
- "an angel touched Elijah twice and told him to eat" → STORY:1 Kings 19:7
- "Elijah heard a still small voice" → STORY:1 Kings 19:12

Naaman:
- "Naaman was a great man but he was a leper" → STORY:2 Kings 5:1
- "the little girl told Naaman's wife about the prophet in Israel" → STORY:2 Kings 5:3
- "Elisha told Naaman to dip seven times in the Jordan" → STORY:2 Kings 5:10
- "Naaman was angry because Elisha didn't come out himself" → STORY:2 Kings 5:11
- "Naaman dipped seven times and his flesh was restored like a child" → STORY:2 Kings 5:14

Esther:
- "Esther was afraid to go before the king without being called" → STORY:Esther 4:11
- "Mordecai said who knows if you came to the kingdom for such a time as this" → STORY:Esther 4:14
- "Esther said if I perish I perish and went before the king" → STORY:Esther 4:16
- "the king held out his golden sceptre to Esther" → STORY:Esther 5:2

Job:
- "Job lost his children his wealth and his health in one day" → STORY:Job 1:13
- "Satan told God Job only serves you because you blessed him" → STORY:Job 1:9
- "Job's wife told him to curse God and die" → STORY:Job 2:9
- "Job said though he slay me yet will I trust him" → STORY:Job 13:15
- "God restored Job's fortunes double of what he had before" → STORY:Job 42:10

Daniel:
- "Shadrach Meshach and Abednego refused to bow to the golden image" → STORY:Daniel 3:12
- "they were thrown into the furnace heated seven times hotter" → STORY:Daniel 3:19
- "a fourth man appeared in the fire like the son of God" → STORY:Daniel 3:25
- "they came out of the fire without even the smell of smoke" → STORY:Daniel 3:27
- "the king made a decree that Daniel's God could not be prayed to" → STORY:Daniel 6:7
- "Daniel opened his window and prayed three times a day anyway" → STORY:Daniel 6:10
- "Daniel was thrown into the den of lions" → STORY:Daniel 6:16
- "God shut the mouths of the lions" → STORY:Daniel 6:22

Jonah:
- "God told Jonah to go to Nineveh but Jonah ran the other way" → STORY:Jonah 1:3
- "the sailors threw Jonah into the sea and the storm stopped" → STORY:Jonah 1:15
- "a great fish swallowed Jonah and he was inside three days" → STORY:Jonah 1:17
- "Jonah prayed from the belly of the fish" → STORY:Jonah 2:1
- "the fish vomited Jonah onto dry land" → STORY:Jonah 2:10
- "Nineveh repented and God spared the city" → STORY:Jonah 3:10

NEW TESTAMENT STORIES:

Birth of Jesus:
- "Mary was told by the angel Gabriel she would conceive" → STORY:Luke 1:31
- "Mary said let it be unto me according to your word" → STORY:Luke 1:38
- "there was no room for them in the inn" → STORY:Luke 2:7
- "Jesus was laid in a manger wrapped in swaddling clothes" → STORY:Luke 2:7
- "the shepherds heard the angels singing glory to God" → STORY:Luke 2:14
- "wise men followed the star to find the baby Jesus" → STORY:Matthew 2:9
- "Herod killed all the children two years and under" → STORY:Matthew 2:16

Jesus Baptism & Temptation:
- "John baptized Jesus in the Jordan and a dove descended" → STORY:Matthew 3:16
- "God said this is my beloved son in whom I am well pleased" → STORY:Matthew 3:17
- "Satan took Jesus to a high mountain and showed him all the kingdoms" → STORY:Matthew 4:8
- "Jesus said get behind me Satan thou shalt worship the Lord thy God only" → STORY:Matthew 4:10

Miracles of Jesus:
- "Jesus turned water into wine at the wedding in Cana" → STORY:John 2:9
- "Jesus fed five thousand people with five loaves and two fish" → STORY:Matthew 14:19
- "twelve baskets of fragments were left over" → STORY:Matthew 14:20
- "Peter stepped out of the boat and walked on water toward Jesus" → STORY:Matthew 14:29
- "Peter began to sink when he took his eyes off Jesus" → STORY:Matthew 14:30
- "Jesus healed ten lepers but only one came back to say thank you" → STORY:Luke 17:15
- "the one who came back was a Samaritan" → STORY:Luke 17:16
- "thy faith hath made thee whole, go thy way" → STORY:Luke 17:19
- "Jesus spit on the ground made clay and put it on the blind man's eyes" → STORY:John 9:6
- "the man was told to go wash in the pool of Siloam" → STORY:John 9:7

Lazarus:
- "Lazarus had been dead four days and Martha said Lord by now he stinketh" → STORY:John 11:39
- "Jesus wept at the tomb of Lazarus" → STORY:John 11:35
- "Jesus said I am the resurrection and the life" → STORY:John 11:25
- "Jesus cried with a loud voice Lazarus come forth" → STORY:John 11:43
- "Lazarus came out still bound with grave clothes" → STORY:John 11:44

Parables:
- "the prodigal son took his inheritance and wasted it in riotous living" → STORY:Luke 15:13
- "the prodigal son came to himself and said I will arise and go to my father" → STORY:Luke 15:18
- "when the father saw him from a great way off he ran and fell on his neck" → STORY:Luke 15:20
- "the father said bring the best robe and put a ring on his finger" → STORY:Luke 15:22
- "the good samaritan found the man beaten on the road" → STORY:Luke 10:33
- "the good samaritan poured oil and wine and took him to the inn" → STORY:Luke 10:34
- "Zacchaeus was small in stature and climbed a sycamore tree to see Jesus" → STORY:Luke 19:4
- "Jesus looked up and said Zacchaeus come down today I must stay at your house" → STORY:Luke 19:5

Woman at the Well & Woman caught in Adultery:
- "Jesus asked a Samaritan woman for water at Jacob's well" → STORY:John 4:7
- "Jesus said I will give you living water and you will never thirst again" → STORY:John 4:14
- "Jesus said go call your husband, she said I have no husband" → STORY:John 4:16
- "the Pharisees brought a woman caught in adultery to Jesus" → STORY:John 8:3
- "Jesus stooped down and wrote on the ground" → STORY:John 8:6
- "he that is without sin let him cast the first stone" → STORY:John 8:7
- "they all left one by one starting from the eldest" → STORY:John 8:9

Crucifixion & Resurrection:
- "Jesus prayed in the garden of Gethsemane sweating drops of blood" → STORY:Luke 22:44
- "Peter denied Jesus three times before the cock crowed" → STORY:Matthew 26:75
- "Pilate washed his hands and said I am innocent of this man's blood" → STORY:Matthew 27:24
- "they crucified Jesus between two thieves" → STORY:Luke 23:33
- "the thief said Lord remember me when you come into your kingdom" → STORY:Luke 23:42
- "the veil of the temple was torn from top to bottom" → STORY:Matthew 27:51
- "Mary Magdalene came to the tomb early and it was empty" → STORY:John 20:1
- "the angel said he is not here he is risen" → STORY:Matthew 28:6
- "Thomas said unless I see the nail prints I will not believe" → STORY:John 20:25
- "Jesus appeared and said reach your hand here and thrust it into my side" → STORY:John 20:27

Early Church:
- "the Holy Spirit came like a rushing mighty wind and tongues of fire" → STORY:Acts 2:2
- "they all spoke in tongues as the Spirit gave utterance" → STORY:Acts 2:4
- "Peter preached and three thousand souls were saved in one day" → STORY:Acts 2:41
- "Peter and John said silver and gold have I none but such as I have give I thee" → STORY:Acts 3:6
- "the lame man leapt up and walked and entered the temple" → STORY:Acts 3:8
- "Stephen was stoned and he saw Jesus standing at the right hand of God" → STORY:Acts 7:55
- "Saul was on his way to Damascus to persecute Christians" → STORY:Acts 9:1
- "a light from heaven blinded Saul and he fell to the ground" → STORY:Acts 9:3
- "Saul heard a voice saying why are you persecuting me" → STORY:Acts 9:4
- "Paul and Silas were beaten and put in prison with their feet in stocks" → STORY:Acts 16:23
- "at midnight Paul and Silas prayed and sang hymns" → STORY:Acts 16:25
- "suddenly there was a great earthquake and all the prison doors opened" → STORY:Acts 16:26
- "the jailer fell down trembling and said what must I do to be saved" → STORY:Acts 16:30

Respond with ONLY one of:
- A Bible reference: "Book Chapter:Verse" (e.g. "John 3:16")
- A navigation command: "NAV:NEXT", "NAV:PREV", "NAV:VERSE:20", "NAV:CHAPTER:5"
- A narrative story: "STORY:Book Chapter:Verse" (e.g. "STORY:1 Samuel 17:45")
- null

Nothing else. No explanation. No punctuation after.`;

    const aiResult = await aiOpenAI({
      kind: 'chat',
      body: {
        model: 'gpt-4o-mini',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      }
    });
    if (aiResult._status !== 200) {
      if (aiResult.upgradeRequired) return { success: false, error: aiResult.error, upgradeRequired: true };
      return { success: false, error: aiResult.error?.message || aiResult.error || 'OpenAI API error' };
    }

    const rawResponse = aiResult.choices[0].message.content.trim().replace(/[.,!?;:]$/g, '');

    if (rawResponse === 'null' || !rawResponse) {
      return { success: true, reference: null };
    }

    if (rawResponse.startsWith('NAV:')) {
      return { success: true, reference: rawResponse, verse: null };
    }

    const isStory = rawResponse.startsWith('STORY:');
    const cleanReference = isStory ? rawResponse.replace('STORY:', '') : rawResponse;

    const verseResponse = await fetch(`https://bible-api.com/${encodeURIComponent(cleanReference)}?translation=kjv`);
    const verseData = await verseResponse.json();

    if (verseData.error) {
      return { success: true, reference: cleanReference, verse: null, isStory };
    }

    return { success: true, reference: verseData.reference, verse: verseData, isStory };

  } catch (error) {
    console.error('Bible detection error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-fetch-verse', async (_event, reference) => {
  try {
    const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) return { success: false, error: data.error };
    return { success: true, verse: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('send-to-display', async (_event, verseData) => {
  broadcastToDisplays('show-verse', verseData);
  return { success: true };
});

ipcMain.handle('parse-verse-reference', async (_event, reference) => {
  try {
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)/);
    if (!match) return { success: false };
    return {
      success: true,
      book: match[1].trim(),
      chapter: parseInt(match[2]),
      verse: parseInt(match[3])
    };
  } catch (error) {
    return { success: false };
  }
});

// ============================================
// SETTINGS HANDLERS
// ============================================

ipcMain.handle('get-settings', async () => {
  const settings = {};
  if (currentUser) settings.email = currentUser.email;
  if (currentChurch) {
    settings.church_name = currentChurch.name;
    if (currentChurch.location) settings.location = currentChurch.location;
    if (currentChurch.size) settings.size = currentChurch.size;
  }

  try {
    const { data, error } = await supabase
      .from('church_settings')
      .select('*')
      .limit(1)
      .single();
    if (!error && data) {
      Object.assign(settings, data);
      // auth email always wins over stored value
      if (currentUser) settings.email = currentUser.email;
    }
  } catch (e) {
    // church_settings table may not exist yet — return base user/church data
  }
  return { success: true, settings };
});

ipcMain.handle('save-settings', async (_event, updates) => {
  try {
    const { data: existing } = await supabase
      .from('church_settings')
      .select('id')
      .limit(1)
      .single();
    if (existing) {
      const { error } = await supabase
        .from('church_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('church_settings')
        .insert([{ ...updates }]);
      if (error) throw error;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('set-display-logo', (_event, payload) => {
  broadcastToDisplays('show-logo-watermark', payload);
});

ipcMain.handle('set-timer-position', (_event, position) => {
  broadcastToDisplays('set-timer-position', position);
});

ipcMain.handle('change-password', async (_event, newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// SCREEN CONFIG HANDLERS
// ============================================

ipcMain.handle('get-available-displays', () => {
  return getAvailableDisplays();
});

ipcMain.handle('get-screen-configs', async () => {
  try {
    const { data, error } = await supabase
      .from('screen_configs')
      .select('*')
      .order('screen_index', { ascending: true });
    if (error) throw error;
    const defaults = getDefaultScreenConfigs();
    const merged = data?.length
      ? defaults.map(def => data.find(d => d.screen_index === def.screen_index) || def)
      : defaults;
    return { success: true, configs: applyStoredTimers(merged) };
  } catch (error) {
    return { success: false, error: error.message, configs: applyStoredTimers(getDefaultScreenConfigs()) };
  }
});

ipcMain.handle('save-screen-config', async (event, config) => {
  try {
    // show_timer lives in local store, not the Supabase table (avoids a schema change)
    if (config.show_timer !== undefined) {
      const timers = store.get('screenTimers', {});
      timers[config.screen_index] = config.show_timer;
      store.set('screenTimers', timers);
    }
    const { show_timer, ...dbConfig } = config;

    const { data: existing } = await supabase
      .from('screen_configs')
      .select('id')
      .eq('screen_index', dbConfig.screen_index)
      .single();
    if (existing) {
      await supabase.from('screen_configs').update({ ...dbConfig, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('screen_configs').insert([dbConfig]);
    }
    // Keep in-memory array in sync so toggle-screen / reload-screen see the latest profile
    const idx = screenConfigs.findIndex(c => c.screen_index === config.screen_index);
    if (idx !== -1) screenConfigs[idx] = { ...screenConfigs[idx], ...config };
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Close and reopen a running display window so a profile change takes effect immediately
ipcMain.on('reload-screen', async (event, { screenIndex }) => {
  const config = screenConfigs.find(c => c.screen_index === screenIndex);
  if (!config || !config.enabled) return;

  // Close existing window
  const existing = displayWindows.find(d => d.screenIndex === screenIndex);
  if (existing && !existing.window.isDestroyed()) existing.window.close();

  // Small delay to let the closed event clean up displayWindows
  await new Promise(r => setTimeout(r, 250));

  const displays = getAvailableDisplays();
  let targetDisplay = displays.find(d => d.id === config.display_id);
  if (!targetDisplay) {
    targetDisplay = (config.screen_index === 1 && displays.length > 1)
      ? displays.find(d => !d.isPrimary) || displays[0]
      : displays[0];
  }

  const win = new BrowserWindow({
    x: targetDisplay.bounds.x, y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width, height: targetDisplay.bounds.height,
    title: 'Studio Display', backgroundColor: '#000000',
    show: false, icon: appIcon,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  const rendererFile = config.content_profile === 'confidence' ? 'stage.html' : 'display.html';
  win.loadFile(path.join(__dirname, rendererFile), {
    query: {
      profile: config.content_profile,
      screenIndex: config.screen_index.toString(),
      screenName: config.screen_name
    }
  });

  win.on('closed', () => {
    displayWindows = displayWindows.filter(d => d.screenIndex !== config.screen_index);
    displayWindow = displayWindows.find(d =>
      d.config.content_profile !== 'stage' &&
      d.config.content_profile !== 'confidence' &&
      !d.config.ndi_enabled
    )?.window || null;
  });

  displayWindows.push({ window: win, config, screenIndex: config.screen_index });
  if (!displayWindow && config.content_profile !== 'stage' && config.content_profile !== 'confidence') displayWindow = win;

  // If live session is running, show immediately fullscreen
  if (displayWindows.some(d => d.window.isVisible())) {
    win.show();
    win.setFullScreen(true);
  }
});

ipcMain.on('toggle-screen', async (event, { screenIndex, enabled }) => {
  const config = screenConfigs.find(c => c.screen_index === screenIndex);
  if (!config) return;
  config.enabled = enabled;

  if (!enabled) {
    const existing = displayWindows.find(d => d.screenIndex === screenIndex);
    if (existing && !existing.window.isDestroyed()) existing.window.close();
    return;
  }

  // Create only the single newly-enabled window (don't reload/wipe all configs)
  if (config.ndi_enabled) return;

  const displays = getAvailableDisplays();
  let targetDisplay = displays.find(d => d.id === config.display_id);
  if (!targetDisplay) {
    targetDisplay = (config.screen_index === 1 && displays.length > 1)
      ? displays.find(d => !d.isPrimary) || displays[0]
      : displays[0];
  }

  const win = new BrowserWindow({
    x: targetDisplay.bounds.x, y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width, height: targetDisplay.bounds.height,
    title: 'Studio Display', backgroundColor: '#000000',
    show: false, icon: appIcon,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  const toggleRendererFile = config.content_profile === 'confidence' ? 'stage.html' : 'display.html';
  win.loadFile(path.join(__dirname, toggleRendererFile), {
    query: {
      profile: config.content_profile,
      screenIndex: config.screen_index.toString(),
      screenName: config.screen_name
    }
  });

  win.on('closed', () => {
    displayWindows = displayWindows.filter(d => d.screenIndex !== config.screen_index);
    displayWindow = displayWindows.find(d =>
      d.config.content_profile !== 'stage' &&
      d.config.content_profile !== 'confidence' &&
      !d.config.ndi_enabled
    )?.window || null;
  });

  displayWindows.push({ window: win, config, screenIndex: config.screen_index });
  if (!displayWindow && config.content_profile !== 'stage' && config.content_profile !== 'confidence') displayWindow = win;
});

ipcMain.on('reassign-screen-display', (event, { screenIndex, displayId }) => {
  const existing = displayWindows.find(d => d.screenIndex === screenIndex);
  if (!existing || existing.window.isDestroyed()) return;
  const displays = getAvailableDisplays();
  const target = displays.find(d => d.id === displayId);
  if (!target) return;
  existing.window.setFullScreen(false);
  existing.window.setBounds(target.bounds);
  existing.window.setFullScreen(true);
});

ipcMain.on('schedule-item-changed', (event, data) => {
  // Send next-item hint to stage, full, and confidence monitors
  for (const { window: win, config } of displayWindows) {
    if (!win || win.isDestroyed()) continue;
    if (config.content_profile === 'stage' || config.content_profile === 'full' || config.content_profile === 'confidence') {
      win.webContents.send('set-next-item', data);
    }
  }
});

// Toggle whether a screen shows the schedule countdown timer
ipcMain.on('set-screen-timer', (event, { screenIndex, showTimer }) => {
  const config = screenConfigs.find(c => c.screen_index === screenIndex);
  if (config) config.show_timer = showTimer;
  const entry = displayWindows.find(d => d.screenIndex === screenIndex);
  if (entry) {
    entry.config.show_timer = showTimer;
    // Hide the timer immediately if it was just turned off
    if (!showTimer && entry.window && !entry.window.isDestroyed()) {
      entry.window.webContents.send('stop-countdown', null);
    }
  }
});

// ============================================
// NDI HANDLERS (graceful degradation — requires NDI SDK from ndi.video)
// ============================================

let grandiose = null;
let ndiSender = null;
let ndiCaptureInterval = null;
let ndiReceiver = null;

function initNDI() {
  try {
    grandiose = require('grandiose');
    console.log('✅ NDI (grandiose) loaded successfully');
  } catch (err) {
    console.log('⚠️ NDI not available:', err.message);
    console.log('⚠️ Install NDI SDK from ndi.video, then run: npm install grandiose');
    grandiose = null;
  }
}

async function startNDIOutput(name) {
  if (!grandiose) return { success: false, error: 'NDI SDK not installed. Download free from ndi.video, then run: npm install grandiose' };
  try {
    ndiSender = await grandiose.send({ name: name || 'Studio by Scientist', clockVideo: true, clockAudio: false });
    const ndiConfig = screenConfigs.find(c => c.ndi_enabled && c.enabled);
    const targetEntry = ndiConfig
      ? displayWindows.find(d => d.screenIndex === ndiConfig.screen_index)
      : displayWindows[0];
    const targetWindow = targetEntry?.window;
    if (!targetWindow) return { success: false, error: 'No display window to capture for NDI' };
    let frameCount = 0;
    ndiCaptureInterval = setInterval(async () => {
      try {
        if (!targetWindow || targetWindow.isDestroyed()) { stopNDIOutput(); return; }
        const image = await targetWindow.webContents.capturePage();
        const size = image.getSize();
        const bgraBuffer = image.toBitmap();
        await ndiSender.video({
          xres: size.width, yres: size.height,
          frameRateN: 30000, frameRateD: 1001,
          pictureAspectRatio: size.width / size.height,
          frameFormatType: grandiose.FORMAT_TYPE_PROGRESSIVE,
          timecode: grandiose.SEND_TIMECODE_SYNTHESIZE,
          lineStrideBytes: size.width * 4,
          data: bgraBuffer
        });
        frameCount++;
        if (frameCount % 150 === 0) console.log(`📡 NDI: ${frameCount} frames sent`);
      } catch (err) {
        console.error('NDI frame error:', err.message);
      }
    }, 1000 / 30);
    console.log(`📡 NDI output started: "${name}"`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function stopNDIOutput() {
  if (ndiCaptureInterval) { clearInterval(ndiCaptureInterval); ndiCaptureInterval = null; }
  if (ndiSender) { ndiSender.destroy(); ndiSender = null; }
  console.log('📡 NDI output stopped');
}

async function findNDISources() {
  if (!grandiose) return { success: false, error: 'NDI SDK not installed', sources: [] };
  try {
    const sources = await grandiose.find({ showLocalSources: true, groups: [] });
    return { success: true, sources: sources.map(s => ({ name: s.name, urlAddress: s.urlAddress })) };
  } catch (err) {
    return { success: false, error: err.message, sources: [] };
  }
}

async function startNDIInput(sourceName) {
  if (!grandiose) return { success: false, error: 'NDI SDK not installed' };
  try {
    const sources = await grandiose.find({ showLocalSources: true });
    const source = sources.find(s => s.name === sourceName);
    if (!source) return { success: false, error: 'NDI source not found' };
    ndiReceiver = await grandiose.receive({ source, colorFormat: grandiose.COLOR_FORMAT_BGRA_RGBA });
    const pollFrames = async () => {
      if (!ndiReceiver) return;
      try {
        const frame = await ndiReceiver.video(5000);
        if (frame && controlWindow && !controlWindow.isDestroyed()) {
          const base64 = Buffer.from(frame.data).toString('base64');
          controlWindow.webContents.send('ndi-frame', { width: frame.xres, height: frame.yres, data: base64 });
        }
        setImmediate(pollFrames);
      } catch (err) {
        if (err.message !== 'Timed out') console.error('NDI receive error:', err.message);
        setImmediate(pollFrames);
      }
    };
    pollFrames();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

ipcMain.handle('ndi-check-available', () => ({ available: !!grandiose }));
ipcMain.handle('ndi-start-output', async (event, name) => startNDIOutput(name));
ipcMain.handle('ndi-stop-output', async () => { stopNDIOutput(); return { success: true }; });
ipcMain.handle('ndi-find-sources', async () => findNDISources());
ipcMain.handle('ndi-start-input', async (event, sourceName) => startNDIInput(sourceName));

ipcMain.handle('get-shared-songs', async () => {
  try {
    const { data, error } = await supabase
      .from('shared_songs')
      .select('id, title, artist, voiced_by, language, category, lyrics, price_tier, audio_url, thumbnail_url')
      .eq('published', true)
      .order('title', { ascending: true });
    if (error) throw error;
    return { success: true, songs: data || [] };
  } catch (err) {
    return { success: false, error: err.message, songs: [] };
  }
});

// ============================================
// LIBREOFFICE → PDF → IMAGE PIPELINE (exact slide fidelity)
// ============================================

// Locate the LibreOffice "soffice" binary across platforms
function findSoffice() {
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      ]
    : process.platform === 'darwin'
    ? [
        '/Applications/LibreOffice.app/Contents/MacOS/soffice',
        '/opt/homebrew/bin/soffice',
        '/usr/local/bin/soffice',
      ]
    : [
        '/usr/bin/soffice',
        '/usr/local/bin/soffice',
        '/opt/libreoffice/program/soffice',
        '/snap/bin/libreoffice',
      ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch (e) {}
  }
  // Fall back to PATH lookup
  try {
    const cmd = process.platform === 'win32' ? 'where soffice' : 'which soffice';
    const found = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split(/\r?\n/)[0];
    if (found && fs.existsSync(found)) return found;
  } catch (e) {}
  return null;
}

// Convert a .pptx to .pdf using headless LibreOffice; returns the pdf path or null
function convertPptxToPdf(soffice, filePath, outDir) {
  return new Promise((resolve, reject) => {
    // Isolated user profile avoids "LibreOffice already running" conflicts
    const profile = 'file://' + path.join(outDir, 'lo-profile');
    execFile(
      soffice,
      ['--headless', '--norestore', `-env:UserInstallation=${profile}`,
       '--convert-to', 'pdf', '--outdir', outDir, filePath],
      { timeout: 180000 },
      (err) => {
        if (err) return reject(err);
        const pdf = path.join(outDir, path.basename(filePath, path.extname(filePath)) + '.pdf');
        resolve(fs.existsSync(pdf) ? pdf : null);
      }
    );
  });
}

// Hidden window that runs pdf.js to rasterize PDF pages to PNG data URLs
let pdfRendererWin = null;
let pdfRendererReady = null;

function ensurePdfRenderer() {
  if (pdfRendererReady) return pdfRendererReady;
  pdfRendererReady = new Promise((resolve, reject) => {
    let base = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'legacy', 'build');
    // Packaged: pdfjs is unpacked from the asar (see build.asarUnpack)
    if (app.isPackaged) base = base.replace('app.asar', 'app.asar.unpacked');
    const libUrl = 'file://' + path.join(base, 'pdf.mjs');
    const workerUrl = 'file://' + path.join(base, 'pdf.worker.mjs');
    pdfRendererWin = new BrowserWindow({
      show: false,
      // Local-only window that rasterizes PDFs; webSecurity off so pdf.js can
      // spawn its module worker from a file:// URL without origin blocking
      webPreferences: { nodeIntegration: true, contextIsolation: false, webSecurity: false }
    });
    pdfRendererWin.on('closed', () => { pdfRendererWin = null; pdfRendererReady = null; });
    ipcMain.once('pdf-renderer-ready', (_e, status) => {
      if (status && status.ok) resolve();
      else reject(new Error(status?.error || 'pdf renderer failed to init'));
    });
    pdfRendererWin.loadFile(path.join(__dirname, 'pdfRenderer.html'), {
      query: { lib: libUrl, worker: workerUrl }
    });
  });
  return pdfRendererReady;
}

async function renderPdfToImages(pdfPath, scale = 2.0) {
  await ensurePdfRenderer();
  return new Promise((resolve, reject) => {
    ipcMain.once('pdf-rendered', (_e, res) => {
      if (res && res.success) resolve({ images: res.images, aspect: res.aspect });
      else reject(new Error(res?.error || 'pdf render failed'));
    });
    pdfRendererWin.webContents.send('render-pdf', { pdfPath, scale });
  });
}

ipcMain.handle('import-pptx', async () => {
  const gate = isFeatureAllowed('pptxImport');
  if (!gate.allowed) return gate;
  const result = await dialog.showOpenDialog(controlWindow, {
    title: 'Import PowerPoint File',
    filters: [{ name: 'PowerPoint', extensions: ['pptx'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true };

  const filePath = result.filePaths[0];

  // ── High-fidelity path: LibreOffice → PDF → PNG per slide ──
  const soffice = findSoffice();
  if (soffice) {
    let tmpDir = null;
    try {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sbs-pptx-'));
      const pdf = await convertPptxToPdf(soffice, filePath, tmpDir);
      if (pdf) {
        const { images, aspect } = await renderPdfToImages(pdf, 1.5);
        if (images && images.length) {
          const slides = images.map((img, i) => ({ index: i + 1, image: img }));
          fs.rm(tmpDir, { recursive: true, force: true }, () => {});
          return {
            success: true, mode: 'image', slides,
            filename: path.basename(filePath, '.pptx'),
            slideW: Math.round(aspect * 1000), slideH: 1000
          };
        }
      }
    } catch (err) {
      console.error('LibreOffice conversion failed, falling back to parser:', err.message);
    } finally {
      if (tmpDir) fs.rm(tmpDir, { recursive: true, force: true }, () => {});
    }
  }

  // ── Fallback: parse shapes/text/images from the XML directly ──
  try {
    const JSZip = require('jszip');
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);

    // Get slide dimensions from presentation.xml
    let slideW = 9144000, slideH = 6858000;
    const presFile = zip.files['ppt/presentation.xml'];
    if (presFile) {
      const presXml = await presFile.async('text');
      const szMatch = presXml.match(/p:sldSz[^/]*cx="(\d+)"[^/]*cy="(\d+)"/);
      if (szMatch) { slideW = parseInt(szMatch[1]); slideH = parseInt(szMatch[2]); }
    }

    const slideEntries = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => parseInt(a.match(/(\d+)\.xml$/)[1]) - parseInt(b.match(/(\d+)\.xml$/)[1]));

    const slides = [];
    for (const slideName of slideEntries) {
      const xml = await zip.files[slideName].async('text');
      const slideNum = slideName.match(/(\d+)\.xml$/)[1];
      const relPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;

      // Load slide relationships once (maps rId -> media file) for bg + pictures
      let relXml = '';
      if (zip.files[relPath]) relXml = await zip.files[relPath].async('text');

      // Resolve an embed rId to a base64 data URL
      const resolveEmbed = async (rId) => {
        if (!relXml) return null;
        const relTarget = relXml.match(new RegExp(`Id="${rId}"[^>]+Target="([^"]+)"`));
        if (!relTarget) return null;
        const mediaPath = ('ppt/slides/' + relTarget[1]).replace(/\/[^/]+\/\.\.\//g, '/');
        if (!zip.files[mediaPath]) return null;
        const imgB64 = await zip.files[mediaPath].async('base64');
        const ext = mediaPath.split('.').pop().toLowerCase();
        return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${imgB64}`;
      };

      // Background color
      let background = '#1a1a1a';
      const bgSolid = xml.match(/<p:bg>[\s\S]*?<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/);
      if (bgSolid) background = '#' + bgSolid[1];

      // Background image
      let bgImage = null;
      const bgBlip = xml.match(/<p:bg>[\s\S]*?<a:blip[^>]+r:embed="(rId\d+)"/);
      if (bgBlip) bgImage = await resolveEmbed(bgBlip[1]);

      // Extract shapes with position + styled text
      const shapes = [];
      const spMatches = xml.match(/<p:sp\b[\s\S]*?<\/p:sp>/g) || [];
      for (const spXml of spMatches) {
        const offM = spXml.match(/<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/);
        const extM = spXml.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
        if (!offM || !extM) continue;

        const x = Math.max(0, parseInt(offM[1]) / slideW * 100);
        const y = Math.max(0, parseInt(offM[2]) / slideH * 100);
        const w = parseInt(extM[1]) / slideW * 100;
        const h = parseInt(extM[2]) / slideH * 100;

        const paragraphs = [];
        const paraMatches = spXml.match(/<a:p\b[\s\S]*?<\/a:p>/g) || [];
        for (const pXml of paraMatches) {
          const alignM = pXml.match(/<a:pPr[^>]*algn="([^"]+)"/);
          const align = alignM ? (alignM[1] === 'ctr' ? 'center' : alignM[1] === 'r' ? 'right' : 'left') : 'left';

          const runs = [];
          const runMatches = pXml.match(/<a:r\b[\s\S]*?<\/a:r>/g) || [];
          for (const rXml of runMatches) {
            const tM = rXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/);
            if (!tM || !tM[1]) continue;
            const szM = rXml.match(/\bsz="(\d+)"/);
            const boldM = rXml.match(/<a:rPr[^>]*\bb="1"/);
            const clrM = rXml.match(/<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/);
            runs.push({
              text: tM[1],
              size: szM ? parseInt(szM[1]) / 100 : 20,
              bold: !!boldM,
              color: clrM ? '#' + clrM[1] : '#ffffff'
            });
          }
          if (runs.length > 0) paragraphs.push({ align, runs });
        }
        if (paragraphs.length > 0) shapes.push({ x, y, w, h, paragraphs });
      }

      // Extract embedded pictures (<p:pic>) with position so image-based slides render
      const images = [];
      const picMatches = xml.match(/<p:pic\b[\s\S]*?<\/p:pic>/g) || [];
      for (const picXml of picMatches) {
        const embedM = picXml.match(/<a:blip[^>]+r:embed="(rId\d+)"/);
        const offM = picXml.match(/<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/);
        const extM = picXml.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
        if (!embedM || !offM || !extM) continue;
        const src = await resolveEmbed(embedM[1]);
        if (!src) continue;
        images.push({
          x: Math.max(0, parseInt(offM[1]) / slideW * 100),
          y: Math.max(0, parseInt(offM[2]) / slideH * 100),
          w: parseInt(extM[1]) / slideW * 100,
          h: parseInt(extM[2]) / slideH * 100,
          src
        });
      }

      // Plain text fallback
      const text = shapes.flatMap(s => s.paragraphs.flatMap(p => p.runs.map(r => r.text))).join(' ').trim();
      if (shapes.length > 0 || images.length > 0 || text) {
        slides.push({ index: slides.length + 1, background, bgImage, shapes, images, text });
      }
    }

    return {
      success: true, mode: 'parsed', slides,
      filename: path.basename(filePath, '.pptx'),
      slideW, slideH,
      libreofficeMissing: !soffice
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fetch-lyrics-gpt', async (_event, { title, artist }) => {
  console.log('[lyrics-gpt] fetching lyrics for:', title, 'by', artist);
  try {
    const data = await aiOpenAI({
      kind: 'chat',
      body: {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a lyrics assistant. When asked for song lyrics, provide the complete lyrics with section labels. Format each section with a label in square brackets like [Verse 1], [Chorus], [Bridge], [Outro]. Return ONLY the lyrics with labels — no intro text, no explanations.'
          },
          {
            role: 'user',
            content: `Provide the complete lyrics for "${title}" by ${artist}.`
          }
        ],
        max_tokens: 2000,
        temperature: 0
      }
    });
    console.log('[lyrics-gpt] proxy status:', data._status);
    if (data._status !== 200) {
      if (data.upgradeRequired) return { success: false, error: data.error, upgradeRequired: true };
      return { success: false, error: data.error?.message || data.error || 'OpenAI error' };
    }
    const lyrics = data.choices?.[0]?.message?.content?.trim() || '';
    console.log('[lyrics-gpt] got lyrics, length:', lyrics.length);
    return { success: true, lyrics };
  } catch (err) {
    console.log('[lyrics-gpt] exception:', err.message);
    return { success: false, error: err.message };
  }
});

// ─── Lower Third ───────────────────────────────────────────────────────────
ipcMain.on('show-lower-third', (_event, data) => {
  broadcastToDisplays('show-lower-third', data);
});
ipcMain.on('hide-lower-third', () => {
  broadcastToDisplays('hide-lower-third', null);
});

// ─── Monthly Teaching Document Parser ──────────────────────────────────────
ipcMain.handle('read-teaching-doc', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Open Monthly Teaching Document',
    filters: [
      { name: 'Documents', extensions: ['txt', 'docx', 'pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  if (!filePaths || !filePaths.length) return { success: false, cancelled: true };

  const filePath = filePaths[0];
  const ext = filePath.split('.').pop().toLowerCase();

  try {
    let text = '';

    if (ext === 'txt') {
      text = fs.readFileSync(filePath, 'utf8');

    } else if (ext === 'docx') {
      // DOCX is a ZIP — extract word/document.xml via jszip
      const JSZip = require('jszip');
      const buf = fs.readFileSync(filePath);
      const zip = await JSZip.loadAsync(buf);
      const xmlFile = zip.file('word/document.xml');
      if (!xmlFile) return { success: false, error: 'Invalid DOCX file' };
      const xml = await xmlFile.async('string');
      // Strip XML tags, collapse whitespace
      text = xml
        .replace(/<w:p[ >]/g, '\n<w:p>')   // paragraph → newline
        .replace(/<[^>]+>/g, ' ')           // strip all tags
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n +/g, '\n')
        .trim();

    } else if (ext === 'pdf') {
      // Minimal PDF text extraction — grab raw text between stream markers
      const buf = fs.readFileSync(filePath);
      const raw = buf.toString('latin1');
      const matches = raw.match(/\(([^)]{2,200})\)/g) || [];
      text = matches.map(m => m.slice(1, -1).replace(/\\n/g, '\n').replace(/\\/g, '')).join(' ').replace(/\s+/g, ' ').trim();
      if (text.length < 50) return { success: false, error: 'Could not extract text from PDF. Please save as .txt or .docx instead.' };
    } else {
      return { success: false, error: 'Unsupported file type. Use .txt or .docx.' };
    }

    return { success: true, text, filename: require('path').basename(filePath) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── Extract Weekly Sermon from Teaching Doc via GPT ───────────────────────
ipcMain.handle('extract-weekly-sermon', async (_event, { docText, todayDate }) => {
  const gate = isFeatureAllowed('weeklyTeachingAI');
  if (!gate.allowed) return gate;

  try {
    const data = await aiOpenAI({
      kind: 'chat',
      body: {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a church presentation assistant. The document is a weekly teaching outline used in church services.

The structure typically looks like:
- Week header with date (e.g. "Week 2 (Sun. 17th May 2026.): Series Title – Ref")
- A section heading like "What is in the Word?" — this is the TOPIC/TITLE for that week
- Main points marked with ❖ or bullets, each with scripture references after a dash (–)
- Sub-points marked with ✓ or checkmarks, also with scriptures
- Each point may have 1-3 scripture references listed after it (e.g. "2 Pet. 1:19-21/ Luk. 1:45")

Find the section matching today's date. Return ONLY valid JSON with this exact structure:
{
  "series_title": "The full series name (e.g. Unveiling the Wonders in the Word)",
  "topic": "The section/week topic heading (e.g. What is in the Word?)",
  "week_label": "Week number and date as written in the doc",
  "intro_verse": "Introduction verse reference if present, or null",
  "pastor_name": "Pastor name if explicitly mentioned in the doc, or null",
  "points": [
    {
      "text": "The teaching point text only, no scripture",
      "scriptures": ["Primary Ref e.g. 2 Pet. 1:19-21", "Secondary Ref e.g. Luk. 1:45"],
      "is_main": true
    }
  ]
}

Rules:
- "text" = just the point text, strip the scripture references from it
- "scriptures" = array of all scripture references mentioned on that point line (split by "/" or ",")
- "is_main" = true for ❖ points, false for ✓ sub-points
- Include ALL points and sub-points — do not skip any
- Normalize scripture refs: "2 Pet. 1:19" not "2pet119"`
          },
          {
            role: 'user',
            content: `Today is ${todayDate}.\n\nDocument content:\n${docText.slice(0, 60000)}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      }
    });
    if (data._status !== 200) {
      if (data.upgradeRequired) return { success: false, error: data.error, upgradeRequired: true };
      return { success: false, error: data.error?.message || data.error || 'OpenAI error' };
    }
    const raw = data.choices?.[0]?.message?.content?.trim() || '';
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(jsonStr);
    return { success: true, sermon: parsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

console.log('🎬 Studio by Scientist starting...');