require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

// Service role client (bypasses RLS) - untuk server operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Anon client (respects RLS) - untuk user-level operations jika diperlukan
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase, supabaseClient };