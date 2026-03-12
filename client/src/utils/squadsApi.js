import { assertSupabaseConfigured, supabase } from './supabase';

const toNumber = (value, fallback) => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const sanitizeSquadTag = (value) => String(value || '').replace(/[^a-z]/gi, '').toUpperCase().slice(0, 5);

export const isValidSquadTag = (value) => /^[A-Z]{1,5}$/.test(sanitizeSquadTag(value));

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) {
        return [];
    }

    return Array.from(
        new Set(
            tags
                .map((tag) => String(tag || '').trim())
                .filter(Boolean)
        )
    );
};

export const normalizeSquad = (row) => ({
    id: row.id,
    creatorId: row.creator_id ?? row.creatorId ?? row.leader_id ?? null,
    name: row.name ?? '',
    gameMode: row.game_mode ?? row.gameMode ?? 'Battle Royale',
    platform: row.platform ?? 'Crossplay',
    micRequired: row.mic_required ?? row.micRequired ?? true,
    skillLevel: row.skill_level ?? row.skillLevel ?? 'Casual',
    audience: row.audience ?? 'Open to All',
    comms: row.comms ?? 'Game',
    description: row.description ?? '',
    maxPlayers: toNumber(row.max_players ?? row.maxPlayers, 4),
    playerCount: toNumber(row.player_count ?? row.playerCount, 1),
    acceptingPlayers: row.accepting_players ?? row.acceptingPlayers ?? true,
    tags: Array.isArray(row.tags) ? row.tags : [],
    listingType: row.listing_type ?? row.listingType ?? 'squad_looking_for_players',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    chatConversationId: row.chat_conversation_id ?? null
});

export const fetchSquads = async () => {
    assertSupabaseConfigured();

    const { data, error } = await supabase
        .from('squads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return (data || []).map(normalizeSquad);
};

export const createSquad = async ({ creatorId, ...formData }) => {
    assertSupabaseConfigured();

    // Always trust the live auth session user id to avoid stale local profile ids.
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
        const err = new Error(`auth-check failed: ${authError.message || 'unknown auth error'}`);
        err.code = authError.code;
        err.details = authError.details;
        err.hint = authError.hint;
        throw err;
    }

    const liveCreatorId = authData?.user?.id || creatorId;
    if (!liveCreatorId) {
        const err = new Error('auth-check failed: no authenticated user found for squad creation');
        err.code = 'AUTH_USER_MISSING';
        throw err;
    }

    const listingType = formData.listingType || 'squad_looking_for_players';
    const normalizedName = listingType === 'squad_looking_for_players'
        ? sanitizeSquadTag(formData.name)
        : String(formData.name || '').trim();

    if (listingType === 'squad_looking_for_players' && !isValidSquadTag(normalizedName)) {
        throw new Error('Squad tags must be 1 to 5 letters only.');
    }

    // Do not block squad listing creation on chat conversation setup.
    const conversationId = null;
    const squadId = crypto.randomUUID();

    const common = {
        id: squadId,
        name: normalizedName,
        game_mode: formData.gameMode,
        platform: formData.platform,
        mic_required: true,
        skill_level: formData.skillLevel,
        audience: formData.audience ?? 'Open to All',
        comms: formData.comms ?? 'Game',
        description: formData.description ?? '',
        max_players: toNumber(formData.maxPlayers, 4),
        player_count: 1,
        accepting_players: true,
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        created_at: new Date().toISOString(),
        listing_type: listingType,
        chat_conversation_id: conversationId
    };

    const payload = { creator_id: liveCreatorId, ...common };

    const insertWithTimeout = async (timeoutMs = 15000) => {
        const insertPromise = supabase.from('squads').insert(payload);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => {
                const timeoutError = new Error('squad-insert failed: timed out');
                timeoutError.code = 'SQUAD_INSERT_TIMEOUT';
                reject(timeoutError);
            }, timeoutMs)
        );
        return Promise.race([insertPromise, timeoutPromise]);
    };

    let error = null;
    try {
        const result = await insertWithTimeout(15000);
        error = result?.error || null;
    } catch (firstInsertError) {
        if (String(firstInsertError?.message || '').toLowerCase().includes('timed out')) {
            // One automatic retry after refreshing auth session
            try {
                await supabase.auth.refreshSession();
                const retryResult = await insertWithTimeout(15000);
                error = retryResult?.error || null;
            } catch (retryError) {
                retryError.message = `squad-insert failed after retry: ${retryError.message || 'unknown error'}`;
                throw retryError;
            }
        } else {
            firstInsertError.message = `squad-insert failed: ${firstInsertError.message || 'unknown error'}`;
            throw firstInsertError;
        }
    }

    if (error) {
        // Fallback for older schemas that used leader_id instead of creator_id
        if (error.message?.includes('creator_id') || error.code === '42703') {
            const fallbackPayload = { leader_id: liveCreatorId, ...common };
            const { error: fallbackError } = await supabase
                .from('squads')
                .insert(fallbackPayload);

            if (fallbackError) {
                fallbackError.message = `squad-insert fallback failed: ${fallbackError.message || 'unknown error'}`;
                throw fallbackError;
            }

            await supabase.from('squad_members').insert({ squad_id: squadId, user_id: liveCreatorId, role: 'leader' }).catch(console.warn);
            return normalizeSquad({ id: squadId, creator_id: liveCreatorId, ...common });
        }
        error.message = `squad-insert failed: ${error.message || 'unknown error'}`;
        throw error;
    }

    // Seed the creator as leader in squad_members
    try {
        await supabase.from('squad_members').insert({
            squad_id: squadId,
            user_id: liveCreatorId,
            role: 'leader'
        });
    } catch (memberErr) {
        console.warn('squad_members insert failed:', memberErr);
    }

    return normalizeSquad({ id: squadId, creator_id: liveCreatorId, ...common });
};

export const updateSquad = async (squadId, formData) => {
    assertSupabaseConfigured();

    const listingType = formData.listingType || 'squad_looking_for_players';
    const normalizedName = listingType === 'squad_looking_for_players'
        ? sanitizeSquadTag(formData.name)
        : String(formData.name || '').trim();

    if (!normalizedName) {
        throw new Error('Squad name is required.');
    }

    if (listingType === 'squad_looking_for_players' && !isValidSquadTag(normalizedName)) {
        throw new Error('Squad tags must be 1 to 5 letters only.');
    }

    const payload = {
        name: normalizedName,
        game_mode: formData.gameMode,
        platform: formData.platform,
        mic_required: Boolean(formData.micRequired),
        skill_level: formData.skillLevel,
        audience: formData.audience ?? 'Open to All',
        comms: formData.comms ?? 'Game',
        description: String(formData.description || '').trim(),
        max_players: toNumber(formData.maxPlayers, 4),
        accepting_players: Boolean(formData.acceptingPlayers),
        tags: normalizeTags(formData.tags),
        listing_type: listingType,
    };

    const { data, error } = await supabase
        .from('squads')
        .update(payload)
        .eq('id', squadId)
        .select('*')
        .single();

    if (error) {
        throw error;
    }

    return normalizeSquad(data);
};
