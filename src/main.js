const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store(); 

let authWindow;
let controlWindow;
let displayWindow;
let currentUser = null;
let currentChurch = null;

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
      return true;
    }
  }
  
  console.log('❌ No valid session found');
  return false;
}

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
  });

  // Display Window
  displayWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    x: 150,
    y: 150,
    title: 'Studio Display',
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  const displayPath = path.join(__dirname, 'display.html');
  displayWindow.loadFile(displayPath);

  displayWindow.once('ready-to-show', () => {
    displayWindow.show();
  });

  controlWindow.on('closed', () => {
    if (displayWindow) displayWindow.close();
    controlWindow = null;
  });

  displayWindow.on('closed', () => {
    displayWindow = null;
  });
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
  if (displayWindow) displayWindow.close();
  
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

// IPC Handlers for Bible Display (existing handlers)
ipcMain.on('display-verse', (event, verseData) => {
  console.log('📺 Display verse:', verseData.ref || verseData.reference);
  if (displayWindow && displayWindow.webContents) {
    displayWindow.webContents.send('show-verse', verseData);
  }
});

ipcMain.on('clear-screen', () => {
  console.log('🧹 Clear display');
  if (displayWindow && displayWindow.webContents) {
    displayWindow.webContents.send('clear-display');
  }
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
  if (displayWindow && displayWindow.webContents) {
    displayWindow.webContents.send('show-lyrics', lyricsData);
  }
});


// App ready
app.whenReady().then(async () => {
  console.log('✅ Electron app ready!');
  
  // Initialize Supabase
  initializeSupabase();
  
  // Check authentication
  const isAuthenticated = await checkAuth();
  
  if (isAuthenticated) {
    // User is logged in, open main app
    createAppWindows();
  } else {
    // User not logged in, show auth screen
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
  if (displayWindow && displayWindow.webContents) {
    displayWindow.webContents.send('apply-theme', themeData);
  }
});

console.log('🎬 Studio by Scientist starting...');