import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readData, writeData } from './utils/storage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Supabase client (optional if using frontend client only)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('Supabase credentials missing. API will run in limited mode.');
}

const normalizeClanTag = (value) => String(value || '').replace(/[^a-z]/gi, '').toUpperCase().slice(0, 5);
const isValidClanTag = (value) => /^[A-Z]{1,5}$/.test(normalizeClanTag(value));

const dedupeSquadsByName = (squads = []) => {
    const sorted = [...squads].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    const seen = new Set();
    const unique = [];

    for (const squad of sorted) {
        const normalizedName = normalizeClanTag(squad?.name);
        const key = normalizedName || `__unnamed__${String(squad?.id || '')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(squad);
    }

    return unique;
};

app.get('/', (req, res) => {
    res.send('Drop Zone Squads API is running');
});

// Profiles Endpoints
app.get('/api/profiles', async (req, res) => {
    const profiles = await readData('profiles');
    res.json(profiles);
});

// Squads Endpoints
app.get('/api/squads', async (req, res) => {
    const squads = await readData('squads');
    res.json(dedupeSquadsByName(squads));
});

app.post('/api/squads', async (req, res) => {
    try {
        const squads = await readData('squads');
        const listingType = req.body.listingType || 'squad_looking_for_players';
        const requestedName = listingType === 'squad_looking_for_players'
            ? normalizeClanTag(req.body.name)
            : String(req.body.name || '').trim();
        if (!requestedName) {
            return res.status(400).json({ error: 'Squad name is required' });
        }
        if (listingType === 'squad_looking_for_players' && !isValidClanTag(requestedName)) {
            return res.status(400).json({ error: 'Squad tags must be 1 to 5 letters only.' });
        }
        const duplicateNameExists = squads.some(
            (squad) => normalizeClanTag(squad?.name) === requestedName
        );
        if (duplicateNameExists) {
            return res.status(409).json({ error: 'Clan tag already exists. Choose a different one.' });
        }
        const audience = req.body.audience || 'Open to All';
        const comms = req.body.comms || 'Game';
        const micRequired = req.body.micRequired !== false;
        const description = String(req.body.description || '').trim();
        const acceptingPlayers = req.body.acceptingPlayers !== false;
        const newSquad = {
            id: Date.now(),
            ...req.body,
            name: requestedName,
            audience,
            comms,
            micRequired,
            description,
            acceptingPlayers,
            listingType,
            tags: Array.isArray(req.body.tags)
                ? Array.from(new Set([...req.body.tags, audience, comms]))
                : [audience, comms],
            playerCount: 1, // Reset player count for a new squad
            createdAt: new Date().toISOString()
        };
        squads.unshift(newSquad); // Add to the beginning
        await writeData('squads', squads);
        res.status(201).json(newSquad);
    } catch (error) {
        res.status(500).json({ error: 'Failed to post squad' });
    }
});

app.delete('/api/squads/:id', async (req, res) => {
    try {
        const squads = await readData('squads');
        const squadId = parseInt(req.params.id, 10);
        const updatedSquads = squads.filter(squad => squad.id !== squadId);

        if (squads.length === updatedSquads.length) {
            return res.status(404).json({ error: 'Squad not found' });
        }

        await writeData('squads', updatedSquads);
        res.status(200).json({ message: 'Squad deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete squad' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
