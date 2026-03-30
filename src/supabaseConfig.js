// Supabase configuration for Studio by Scientist

const SUPABASE_URL = 'https://ggjdrmlnveenonphmkdc.supabase.co'; // Replace with your actual URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnamRybWxudmVlbm9ucGhta2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDgxMzgsImV4cCI6MjA4ODIyNDEzOH0.z_vq0xTPLz66DvVwcNLlKMVGNaZqX-DLIyKjJ-gR0aw'; // Replace with your actual key

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

module.exports = { supabase, auth };