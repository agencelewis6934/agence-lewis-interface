import { createClient } from '@supabase/supabase-js';

// Helper to get env vars that might be under different names in Vercel vs Vite
const getEnv = (key: string) => {
    return process.env[key] || process.env[`VITE_${key}`];
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables in server context.'
    );
}

// Create Supabase client for server-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // No session persistence on server
        autoRefreshToken: false,
    },
});
