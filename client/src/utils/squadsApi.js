import { assertSupabaseConfigured, supabase } from './supabase';

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSquad = (row) => ({
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
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString()
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

const shouldTryFallbackInsert = (error) => {
    const code = error?.code || '';
    const message = String(error?.message || '').toLowerCase();
    return (
        code === 'PGRST204' ||
        code === '42703' ||
        code === '22P02' ||
        message.includes('column') ||
        message.includes('does not exist') ||
        message.includes('invalid input syntax for type uuid')
    );
};

const insertAndReturn = async (payload) => {
    const { data, error } = await supabase
        .from('squads')
        .insert(payload)
        .select('*')
        .single();

    if (error) {
        return { data: null, error };
    }

    return { data, error: null };
};

export const createSquad = async ({ creatorId, ...formData }) => {
    assertSupabaseConfigured();

    const common = {
        name: formData.name,
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
        created_at: new Date().toISOString()
    };

    // Try modern app schema first, then fall back to legacy schema variants.
    const payloadVariants = [
        { creator_id: creatorId, ...common },
        { leader_id: creatorId, ...common },
        {
            name: common.name,
            game_mode: common.game_mode,
            platform: common.platform,
            mic_required: common.mic_required,
            skill_level: common.skill_level,
            description: common.description,
            max_players: common.max_players,
            player_count: common.player_count,
            tags: common.tags,
            created_at: common.created_at
        }
    ];

    let lastError = null;

    for (const payload of payloadVariants) {
        const { data, error } = await insertAndReturn(payload);
        if (!error) {
            return normalizeSquad(data);
        }

        lastError = error;
        if (!shouldTryFallbackInsert(error)) {
            throw error;
        }
    }

    throw lastError || new Error('Failed to create squad.');
};
