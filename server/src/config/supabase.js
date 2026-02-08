import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const { supabaseUrl, supabaseKey } = env;

// Guard against initialization if variables are missing
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (supabase) {
    console.log('✅ Supabase client initialized');
} else {
    console.error('⚠️ Supabase client could not be initialized due to missing credentials.');
}
