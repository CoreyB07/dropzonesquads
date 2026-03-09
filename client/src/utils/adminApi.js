import { assertSupabaseConfigured, supabase } from './supabase';

const getCount = async (queryBuilder) => {
    const { count, error } = await queryBuilder;
    if (error) {
        throw error;
    }
    return count || 0;
};

export const fetchAdminStats = async () => {
    assertSupabaseConfigured();

    const [totalMembers, totalSquads, totalSupporters, totalSubscribers] = await Promise.all([
        getCount(supabase.from('profiles').select('*', { count: 'exact', head: true })),
        getCount(supabase.from('squads').select('*', { count: 'exact', head: true })),
        getCount(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('supporter', true)),
        getCount(supabase.from('marketing_subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', true))
    ]);

    return {
        totalMembers,
        totalSquads,
        totalSupporters,
        totalSubscribers
    };
};

export const fetchRecentSignups = async (limit = 12) => {
    assertSupabaseConfigured();

    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username, created_at, marketing_opt_in')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        throw error;
    }

    return data || [];
};
