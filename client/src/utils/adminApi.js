import { assertSupabaseConfigured, supabase } from './supabase';
import { getPublicStorageUrl } from './profilePictures';

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

export const fetchProfilePictureQueue = async (limit = 50) => {
    assertSupabaseConfigured();

    const { data, error } = await supabase
        .from('profile_picture_submissions')
        .select('id, user_id, status, original_path, approved_path, rejection_reason, created_at, reviewed_at, reviewed_by')
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    const userIds = [...new Set((data || []).map((row) => row.user_id).filter(Boolean))];
    let profileMap = new Map();

    if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

        if (profilesError) throw profilesError;
        profileMap = new Map((profiles || []).map((row) => [row.id, row]));
    }

    return (data || []).map((row) => ({
        ...row,
        username: profileMap.get(row.user_id)?.username || 'Unknown',
        previewUrl: getPublicStorageUrl(row.original_path)
    }));
};

export const approveProfilePictureSubmission = async (submissionId, adminUserId) => {
    assertSupabaseConfigured();

    const { data: row, error: rowError } = await supabase
        .from('profile_picture_submissions')
        .select('id, user_id, original_path, status')
        .eq('id', submissionId)
        .maybeSingle();

    if (rowError) throw rowError;
    if (!row || row.status !== 'pending') {
        throw new Error('Submission not found or already reviewed.');
    }

    const filename = row.original_path.split('/').pop();
    const approvedPath = `approved/${row.user_id}/${filename}`;

    const { error: moveError } = await supabase.storage
        .from('profile-pictures')
        .move(row.original_path, approvedPath);

    if (moveError) throw moveError;

    const publicUrl = getPublicStorageUrl(approvedPath);

    const { error: updateSubmissionError } = await supabase
        .from('profile_picture_submissions')
        .update({
            status: 'approved',
            approved_path: approvedPath,
            reviewed_by: adminUserId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: null
        })
        .eq('id', submissionId);

    if (updateSubmissionError) throw updateSubmissionError;

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            avatar_url: publicUrl,
            avatar_custom_status: 'approved'
        })
        .eq('id', row.user_id);

    if (profileError) throw profileError;
};

export const rejectProfilePictureSubmission = async (submissionId, adminUserId, reason = '') => {
    assertSupabaseConfigured();

    const { data: row, error: rowError } = await supabase
        .from('profile_picture_submissions')
        .select('id, user_id, original_path, status')
        .eq('id', submissionId)
        .maybeSingle();

    if (rowError) throw rowError;
    if (!row || row.status !== 'pending') {
        throw new Error('Submission not found or already reviewed.');
    }

    await supabase.storage.from('profile-pictures').remove([row.original_path]);

    const { error: updateSubmissionError } = await supabase
        .from('profile_picture_submissions')
        .update({
            status: 'rejected',
            rejection_reason: reason || null,
            reviewed_by: adminUserId,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

    if (updateSubmissionError) throw updateSubmissionError;

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_custom_status: 'rejected' })
        .eq('id', row.user_id);

    if (profileError) throw profileError;
};
