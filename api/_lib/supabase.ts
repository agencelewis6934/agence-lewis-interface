import { createClient } from '@supabase/supabase-js';

// Helper to get env vars that might be under different names in Vercel vs Vite
const getEnv = (key: string) => {
    return process.env[key] || process.env[`VITE_${key}`];
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
    // Initialized check moved to export
}

// Create Supabase client for server-side usage
let supabaseInstance: any = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    } catch (e) {
        console.error('Failed to create Supabase client:', e);
    }
} else {
    console.error('Missing Supabase environment variables in server context.');
    console.error('SUPABASE_URL present:', !!supabaseUrl);
    console.error('SUPABASE_ANON_KEY present:', !!supabaseAnonKey);
}

export const supabase = supabaseInstance;
