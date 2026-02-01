import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', url);
console.log('Key Prefix:', key ? key.substring(0, 15) : 'None');

if (!url || !key) {
  console.error('Missing URL or Key');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConfig() {
  try {
    // Try a simple request - effectively a "ping" to the health check or just auth
    const start = Date.now();

    // We try to sign in with a fake user to see if we get a "400" (connected) or "timeout" (not connected)
    // Or just check session (local only usually, but verify connectivity via a query if possible)
    // Actually, asking for the project config or a public table is better.
    // Let's try getting a public profile that doesn't exist?

    // Simplest check: getSession usually checks local storage, but we can try to call `getUser` which hits the API
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    const duration = Date.now() - start;
    console.log(`Request took ${duration}ms`);

    if (error) {
      console.log('Response received (Error):', error.message);
      console.log('Detailed Error:', error);
      console.log('✅ Connection Successful (API is reachable, even if table query failed)');
    } else {
      console.log('Response received (Success)');
      console.log('✅ Connection Successful');
    }

  } catch (err) {
    console.error('❌ Connection Failed:', err);
  }
}

testConfig();
