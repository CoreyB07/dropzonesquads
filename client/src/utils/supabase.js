import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://imdkaqhnnmgzgiykmxnz.supabase.co';
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
const supabasePublishableKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
).trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const projectRef = (() => {
    try {
        return new URL(supabaseUrl).hostname.split('.')[0];
    } catch {
        return '';
    }
})();

const authStorageKey = projectRef ? `sb-${projectRef}-auth-token` : '';

const getStoredAccessToken = () => {
    if (!authStorageKey || typeof localStorage === 'undefined') {
        return null;
    }

    try {
        const raw = localStorage.getItem(authStorageKey);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        // Supabase has used a couple of shapes over time.
        return (
            parsed?.access_token ||
            parsed?.currentSession?.access_token ||
            parsed?.session?.access_token ||
            null
        );
    } catch {
        return null;
    }
};

const resilientFetch = async (input, init = {}) => {
    const maxAttempts = 2;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const controller = new AbortController();
        const timeoutMs = 15000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(input, {
                ...init,
                signal: init.signal || controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;

            const isAbort = error?.name === 'AbortError';
            const isNetworkError = /Failed to fetch|NetworkError|ERR_CONNECTION_CLOSED|ERR_NETWORK/i.test(error?.message || '');
            const canRetry = attempt < maxAttempts && (isAbort || isNetworkError);

            if (!canRetry) {
                throw error;
            }

            await sleep(300 * attempt);
        }
    }

    throw lastError;
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabasePublishableKey, {
        accessToken: async () => getStoredAccessToken(),
        global: {
            fetch: resilientFetch
        }
    })
    : null;

export const assertSupabaseConfigured = () => {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error(
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY / VITE_SUPABASE_ANON_KEY) in client/.env.local.'
        );
    }
};
