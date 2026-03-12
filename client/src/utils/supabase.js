import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://imdkaqhnnmgzgiykmxnz.supabase.co';
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
const supabasePublishableKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null;

export const assertSupabaseConfigured = () => {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error(
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY / VITE_SUPABASE_ANON_KEY) in client/.env.local.'
        );
    }
};
