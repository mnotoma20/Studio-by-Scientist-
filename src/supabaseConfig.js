// Supabase configuration for Studio by Scientist

const SUPABASE_URL = 'https://ggjdrmlnveenonphmkdc.supabase.co'; // Replace with your actual URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnamRybWxudmVlbm9ucGhta2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDgxMzgsImV4cCI6MjA4ODIyNDEzOH0.z_vq0xTPLz66DvVwcNLlKMVGNaZqX-DLIyKjJ-gR0aw'; // Replace with your actual key

const { createClient } = require('@supabase/supabase-js');
const Store = require('electron-store');
const { safeStorage } = require('electron');

// ---- Persistent session storage ------------------------------------------------------
// By default supabase-js falls back to an in-memory store in a Node/Electron main process
// (there's no window.localStorage), so a session never survives an app restart — the user
// had to sign in again every single launch. This adapter backs it with electron-store,
// encrypted at rest via the OS keychain (Keychain/Credential Manager/libsecret) through
// Electron's safeStorage where available.
//
// Writes only happen while `persistEnabled` is true, which mirrors the "Remember me"
// checkbox: set true on a sign-in/signup with it checked, and set true automatically the
// moment we successfully recover a previously-remembered session on startup (so a token
// refresh keeps re-persisting rather than the session going stale after one relaunch).
// While disabled, sessions still work normally for the running process — they just live
// in memory and don't survive a restart.
const sessionDisk = new Store({ name: 'session' });
let persistEnabled = false;
const memoryFallback = {};

function encryptForDisk(value) {
  if (safeStorage.isEncryptionAvailable()) {
    return { enc: true, data: safeStorage.encryptString(value).toString('base64') };
  }
  return { enc: false, data: value };
}
function decryptFromDisk(record) {
  if (!record) return null;
  if (record.enc && safeStorage.isEncryptionAvailable()) {
    try { return safeStorage.decryptString(Buffer.from(record.data, 'base64')); }
    catch { return null; }
  }
  return record.data ?? null;
}

const authStorageAdapter = {
  getItem: (key) => {
    const fromDisk = decryptFromDisk(sessionDisk.get(key));
    if (fromDisk != null) { persistEnabled = true; return fromDisk; }
    return memoryFallback[key] ?? null;
  },
  setItem: (key, value) => {
    if (persistEnabled) sessionDisk.set(key, encryptForDisk(value));
    else memoryFallback[key] = value;
  },
  removeItem: (key) => {
    delete memoryFallback[key];
    sessionDisk.delete(key);
  },
};

// Called from main.js after a successful sign-in/signup (true if "Remember me" was
// checked) and on explicit sign-out (false, and wipes anything already on disk).
function setSessionPersistence(enabled) {
  persistEnabled = enabled;
  if (!enabled) sessionDisk.clear();
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

const auth = {
  // Sign up new user (sends OTP email)
  async signUp(email, password, churchData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            church_name: churchData.name,
            church_location: churchData.location,
            church_size: churchData.size
          }
        }
      });

      if (authError) throw authError;

      console.log('✅ Signup initiated, OTP sent to email');

      return { 
        success: true, 
        user: authData.user,
        message: 'Check your email for verification code'
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  // Verify OTP code
  async verifyOTP(email, token, type = 'signup') {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: type === 'signup' ? 'signup' : 'magiclink'
      });

      if (error) throw error;

      // Create church record
      const churchData = data.user.user_metadata;
      
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .insert([
          {
            name: churchData.church_name,
            location: churchData.church_location,
            size: churchData.church_size,
            user_id: data.user.id
          }
        ])
        .select()
        .single();

      if (churchError && churchError.code !== '23505') {
        console.error('Church creation error:', churchError);
      }

      return { 
        success: true, 
        user: data.user, 
        session: data.session,
        church: church || { name: churchData.church_name }
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Resend OTP
  async resendOTP(email) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) throw error;

      return { success: true, message: 'Code resent!' };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in existing user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get church data
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      // If no church, create one from user metadata
      let finalChurch = church;
      if (!church && data.user.user_metadata) {
        const { data: newChurch } = await supabase
          .from('churches')
          .insert([{
            name: data.user.user_metadata.church_name || 'My Church',
            location: data.user.user_metadata.church_location || 'Unknown',
            size: data.user.user_metadata.church_size || 'medium',
            user_id: data.user.id
          }])
          .select()
          .single();
        
        finalChurch = newChurch;
      }

      return { 
        success: true, 
        user: data.user, 
        session: data.session, 
        church: finalChurch
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (!user) return { success: false, user: null };

      const { data: church } = await supabase
        .from('churches')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      return { success: true, user, church };
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get session
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
};

module.exports = { supabase, auth, setSessionPersistence };