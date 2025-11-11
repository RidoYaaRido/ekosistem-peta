// test-supabase.js
require('dotenv').config();

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing');

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  supabase.from('users').select('count').then(({ data, error }) => {
    if (error) {
      console.log('✗ Connection failed:', error.message);
    } else {
      console.log('✓ Connected successfully!');
    }
  });
}