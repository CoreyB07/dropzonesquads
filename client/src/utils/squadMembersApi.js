import { supabase } from './supabase';

// Fetch all members of a squad (with their profile info)
export const fetchSquadMembers = async (squadId) => {
    const { data, error } = await supabase
        .from('squad_members')
        .select('id, user_id, role, joined_at')
        .eq('squad_id', squadId)
        .order('joined_at', { ascending: true });

    if (error) throw error;

    const userIds = Array.from(new Set((data || []).map((m) => m.user_id).filter(Boolean)));
    let profilesById = {};

    if (userIds.length > 0) {
        const { data: profileRows, error: profileErr } = await supabase
            .from('profiles')
            .select('id, username, platform, activision_id, avatar_url')
            .in('id', userIds);

        if (profileErr) throw profileErr;

        profilesById = (profileRows || []).reduce((acc, row) => {
            acc[row.id] = row;
            return acc;
        }, {});
    }

    return (data || []).map((m) => ({
        memberId: m.id,
        id: m.user_id,
        role: m.role,
        joinedAt: m.joined_at,
        ...(profilesById[m.user_id] || {})
    }));
};

// Add a member to a squad (leaders/co-leaders only, enforced by RLS)
export const addSquadMember = async (squadId, userId, role = 'member') => {
    const { error } = await supabase
        .from('squad_members')
        .insert({ squad_id: squadId, user_id: userId, role });
    if (error) throw error;
};

// Update a member's role (promote to co-leader, demote, etc.)
export const updateMemberRole = async (squadId, userId, newRole) => {
    const { error } = await supabase
        .from('squad_members')
        .update({ role: newRole })
        .eq('squad_id', squadId)
        .eq('user_id', userId);
    if (error) throw error;
};

// Remove a member from a squad
export const removeSquadMember = async (squadId, userId) => {
    const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('squad_id', squadId)
        .eq('user_id', userId);
    if (error) throw error;
};

// Check if the current user is a leader or co-leader of a squad
export const getMyRoleInSquad = async (squadId, myUserId) => {
    const { data, error } = await supabase
        .from('squad_members')
        .select('role')
        .eq('squad_id', squadId)
        .eq('user_id', myUserId)
        .maybeSingle();
    if (error) return null;
    return data?.role ?? null;
};

// Fetch all squads a user is a member of
export const fetchUserSquads = async (userId) => {
    const { data, error } = await supabase
        .from('squad_members')
        .select('role, squads(*)')
        .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(row => ({ role: row.role, ...row.squads }));
};
