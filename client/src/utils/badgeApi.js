import { supabase } from './supabase';

export const fetchBadgeCatalog = async () => {
  const { data, error } = await supabase
    .from('badge_catalog')
    .select('id, label, description, category, color_token, icon')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('label', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const fetchSquadMemberBadges = async (squadId) => {
  const { data, error } = await supabase
    .from('member_badges')
    .select('id, user_id, badge_id, reason, expires_at, is_public, badge:badge_id(id, category, label)')
    .eq('squad_id', squadId);

  if (error) throw error;
  return data || [];
};

export const saveMemberBadgeSelection = async ({ squadId, userId, seriousBadgeId, funnyBadgeId, statusBadgeId, assignedBy }) => {
  // Remove active badges in the three managed categories, then re-insert selections.
  const { data: existing, error: existingErr } = await supabase
    .from('member_badges')
    .select('id, badge:badge_id(category)')
    .eq('squad_id', squadId)
    .eq('user_id', userId)
    .is('expires_at', null);

  if (existingErr) throw existingErr;

  const removeIds = (existing || [])
    .filter((row) => ['serious', 'funny', 'status'].includes(row?.badge?.category))
    .map((row) => row.id);

  if (removeIds.length > 0) {
    const { error: delErr } = await supabase.from('member_badges').delete().in('id', removeIds);
    if (delErr) throw delErr;
  }

  const inserts = [seriousBadgeId, funnyBadgeId, statusBadgeId]
    .filter(Boolean)
    .map((badgeId) => ({
      squad_id: squadId,
      user_id: userId,
      badge_id: badgeId,
      assigned_by: assignedBy || null,
      is_public: true
    }));

  if (inserts.length > 0) {
    const { error: insErr } = await supabase.from('member_badges').insert(inserts);
    if (insErr) throw insErr;
  }
};
