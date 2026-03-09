import { writeData } from './utils/storage.js';
import crypto from 'crypto';
import { buildClanTagPool } from './utils/clanTags.js';

const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Crossplay'];
const GAME_MODES = [
    'Battle Royale',
    'Resurgence'
];
const SKILL_LEVELS = ['Casual', 'Competitive', 'Ranked'];
const AUDIENCES = ['Open to All', 'Women Only', 'Men Only'];
const COMMS_OPTIONS = ['Discord', 'Game', 'Any'];
const LFG_TAG_OPTIONS = [
    'Chill',
    'Adults Only',
    'Team Player',
    'Mic Only',
    'Good Comms',
    'No Toxicity',
    'Casual Vibes',
    'Competitive',
    'Ranked Grind',
    'Win Focus',
    'High Kills',
    'New Player Friendly',
    'Discord Preferred',
    'Late Night',
    'Weekend Squad'
];
const ADJECTIVES = ['Tactical', 'Elite', 'Shadow', 'Ghost', 'Alpha', 'Bravo', 'Delta', 'Iron', 'Golden', 'Apex'];
const NOUNS = ['Squad', 'Unit', 'Ops', 'Team', 'Force', 'Raiders', 'Wolves', 'Commandos', 'Legion', 'Vanguard'];
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (max) => Math.floor(Math.random() * max);
const pickExtraTags = (count = 2) => {
    const available = [...LFG_TAG_OPTIONS];
    const picked = [];
    while (picked.length < count && available.length > 0) {
        const idx = randomNumber(available.length);
        picked.push(available[idx]);
        available.splice(idx, 1);
    }
    return picked;
};

const generateProfiles = (count) => {
    const profiles = [];
    for (let i = 0; i < count; i++) {
        const username = `${randomEl(ADJECTIVES)}_${randomEl(NOUNS)}_${Math.floor(Math.random() * 999)}`;
        profiles.push({
            id: crypto.randomUUID(),
            username,
            activisionId: `${username}#${Math.floor(1000000 + Math.random() * 9000000)}`,
            platform: randomEl(PLATFORMS),
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString()
        });
    }
    return profiles;
};

const generateSquads = (count, profiles) => {
    const squads = [];
    const clanTagPool = buildClanTagPool(count);
    for (let i = 0; i < count; i++) {
        const leader = randomEl(profiles);
        const mode = randomEl(GAME_MODES);
        const skill = randomEl(SKILL_LEVELS);
        const audience = randomEl(AUDIENCES);
        const comms = randomEl(COMMS_OPTIONS);
        const platform = leader.platform;
        const maxPlayers = Math.random() > 0.5 ? 4 : 3;
        const closed = Math.random() < 0.18;
        const playerCount = closed
            ? maxPlayers
            : Math.floor(Math.random() * (maxPlayers - 1)) + 1;
        const acceptingPlayers = !closed;

        squads.push({
            id: i + 10, // Avoid collisions with initial data
            name: clanTagPool[i],
            gameMode: mode,
            platform: platform,
            micRequired: true,
            skillLevel: skill,
            audience,
            comms,
            playerCount,
            maxPlayers,
            acceptingPlayers,
            tags: [mode.split(' ')[0], skill, platform, audience, comms, ...pickExtraTags(2)],
            description: `Join us for some ${mode}. Looking for ${skill.toLowerCase()} players.`,
            activisionId: leader.activisionId,
            createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
        });
    }
    return squads;
};

const main = async () => {
    console.log('Generating 200 profiles...');
    const profiles = generateProfiles(200);
    await writeData('profiles', profiles);

    console.log('Generating 100 squads...');
    const squads = generateSquads(100, profiles);
    await writeData('squads', squads);

    console.log('Done! 100 squads and 200 profiles generated.');
};

main();
