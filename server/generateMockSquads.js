import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildClanTagPool } from './utils/clanTags.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAME_MODES = [
    'Battle Royale',
    'Resurgence'
];

const PLATFORMS = [
    'PC',
    'PlayStation',
    'Xbox',
    'Crossplay'
];

const SKILL_LEVELS = [
    'Casual',
    'Competitive',
    'Ranked'
];

const AUDIENCES = [
    'Open to All',
    'Women Only',
    'Men Only'
];

const COMMS = ['Discord', 'Game', 'Any'];
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
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickExtraTags = (count = 2) => {
    const available = [...LFG_TAG_OPTIONS];
    const picked = [];
    while (picked.length < count && available.length > 0) {
        const idx = randomNumber(0, available.length - 1);
        picked.push(available[idx]);
        available.splice(idx, 1);
    }
    return picked;
};

const generateSquads = () => {
    const squads = [];
    const now = Date.now();
    let idCounter = 1000;
    const totalCombinations =
        GAME_MODES.length *
        PLATFORMS.length *
        SKILL_LEVELS.length *
        AUDIENCES.length *
        COMMS.length;
    const clanTagPool = buildClanTagPool(totalCombinations);
    let clanTagIdx = 0;

    // Generate exactly one squad for EVERY single possible combination of filters
    for (const gameMode of GAME_MODES) {
        for (const platform of PLATFORMS) {
            for (const skillLevel of SKILL_LEVELS) {
                for (const audience of AUDIENCES) {
                    for (const comms of COMMS) {
                        const name = clanTagPool[clanTagIdx++];
                        const micRequired = true;
                        const maxPlayers = randomNumber(3, 5);
                        const closed = Math.random() < 0.18;
                        const playerCount = closed
                            ? maxPlayers
                            : randomNumber(1, Math.max(1, maxPlayers - 1));
                        const acceptingPlayers = !closed;

                        const tags = [gameMode.split(' ')[0], skillLevel, platform, audience, comms, ...pickExtraTags(2)];

                        squads.push({
                            id: idCounter++,
                            name,
                            gameMode,
                            platform,
                            micRequired,
                            skillLevel,
                            audience,
                            comms,
                            playerCount,
                            maxPlayers,
                            acceptingPlayers,
                            tags,
                            description: `${audience} squad for ${gameMode} on ${platform}. Comms: ${comms}.`,
                            activisionId: `${name}_${randomNumber(100, 999)}#${randomNumber(1000000, 9999999)}`,
                            createdAt: new Date(now - randomNumber(0, 86400000 * 7)).toISOString() // Random time in the last 7 days
                        });
                    }
                }
            }
        }
    }

    // Sort by newest first
    squads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return squads;
};

const squads = generateSquads();

const filePath = path.join(__dirname, 'data', 'squads.json');
fs.writeFileSync(filePath, JSON.stringify(squads, null, 2));

console.log(`Generated ${squads.length} mock squads and saved to ${filePath}`);
