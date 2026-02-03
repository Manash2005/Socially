import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const supabaseUrl = env.supabaseUrl;
const supabaseKey = env.supabaseKey;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client initialized');
