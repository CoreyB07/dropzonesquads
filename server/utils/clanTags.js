const BASE_CLAN_TAGS = [
    'BEAST', 'IRUN', 'TRUMP', 'RUNUP', 'FLEX', 'BOMB', 'RAGE', 'CLUT', 'SWAT', 'WOLF',
    'NOVA', 'GHOST', 'FURY', 'SHLD', 'RUSH', 'KRON', 'XENO', 'VIBE', 'HYPE', 'DRIP',
    'SNAP', 'OPS', 'ACE', 'GOAT', 'BLITZ', 'SMOKE', 'CRIT', 'RECON', 'MVP', 'SWEAT',
    'STORM', 'FROST', 'VIPER', 'VENOM', 'TITAN', 'BRUTE', 'PHANT', 'SHOCK', 'THORN', 'BLAZE',
    'EMBER', 'INFER', 'RAPID', 'HAVOC', 'ROGUE', 'NINJA', 'SCOPE', 'STRYK', 'RAZOR', 'GLINT',
    'PULSE', 'EPOCH', 'PRIME', 'FORGE', 'SCAR', 'SLATE', 'GRIT', 'CHAMP', 'CLASH', 'QUAKE',
    'SPIKE', 'FLINT', 'TRICK', 'GRAIL', 'STACK', 'RIVAL', 'ONYX', 'NEXUS', 'RADAR', 'KARMA',
    'FABLE', 'VEXED', 'DREAD', 'KINGS', 'KNIFE', 'BLADE', 'ARROW', 'TIGER', 'COBRA', 'MAMBA',
    'RAVEN', 'FALCN', 'EAGLE', 'HAWK', 'HYENA', 'JACKL', 'LYNX', 'PYRO', 'TORCH', 'FLARE',
    'VOLT', 'AMPED', 'JOLT', 'SPARK', 'SURGE', 'CHARG', 'CRASH', 'BREAK', 'WRECK', 'GRIND',
    'FRAG', 'SLAY', 'STING', 'WRATH', 'FERAL', 'SAVAG', 'FANG', 'TALON', 'SKULL', 'BONES',
    'REAPR', 'GRIM', 'NIGHT', 'DUSK', 'DAWN', 'SOLAR', 'LUNAR', 'COSMO', 'COMET', 'ORBIT',
    'ASTRA', 'NEBUL', 'APEX', 'ZENIT', 'VORTX', 'RIPTR', 'ALPHA', 'BRAVO', 'DELTA', 'SIGMA',
    'OMEGA', 'GAMMA', 'KAPPA', 'VECTR', 'RONIN', 'SHOGN', 'SAMUR', 'RAIDR', 'TROOP', 'SQUAD',
    'UNIT', 'FRONT', 'FLANK', 'COVER', 'MERCS', 'KRAIT', 'ADDER', 'VIPRA', 'FROZN', 'HEAT',
    'BLAST', 'BURST', 'TRACK', 'TRACE', 'HUNT', 'STALK', 'PREDR', 'WARDN', 'GUARD', 'WATCH',
    'SENTR', 'DRONE', 'PILOT', 'AIMER', 'FOCUS', 'LASER', 'GUNNR', 'SNIPR', 'RIFTR', 'LOOTR'
];

const PROC_STEMS = [
    'WAR', 'RUN', 'FLX', 'BMB', 'RAG', 'SWA', 'WLF', 'NOV', 'RSH', 'VIB',
    'HYP', 'SNP', 'BLZ', 'SMK', 'RCN', 'STR', 'FRS', 'VPR', 'VNM', 'TTN',
    'BRT', 'SHK', 'BLA', 'EMB', 'RPD', 'HVC', 'RGU', 'NIN', 'SCP', 'RZR',
    'PLS', 'EPC', 'PRM', 'FRG', 'GRT', 'CLS', 'QKE', 'SPK', 'FLN', 'RVL',
    'ONY', 'NXS', 'KRM', 'DRD', 'ARO', 'TGR', 'CBR', 'RVN', 'HWK', 'LNX',
    'PYR', 'FLR', 'VLT', 'JLT', 'SPR', 'SRG', 'CRS', 'BRK', 'WRK', 'GRN',
    'SLY', 'WRT', 'FRL', 'FNG', 'TLN', 'SKL', 'GRM', 'NGT', 'DSK', 'DWN',
    'SLR', 'LNR', 'APX', 'RON', 'SHG', 'SAM', 'RDR', 'MRC', 'KRT', 'ADR',
    'BLS', 'BST', 'HNT', 'STL', 'GDR', 'WTC', 'SNT', 'DRN', 'PLT', 'AMR',
    'ODN', 'THR', 'LKI', 'ZEU'
];

const PROC_ENDINGS = [
    'ON', 'UP', 'EX', 'IT', 'AR', 'US', 'ER', 'IX', 'OR', 'AX',
    'ED', 'AL', 'IN', 'UR', 'OX'
];

const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const addTag = (tag, seen, list) => {
    const normalized = String(tag || '').trim().toUpperCase();
    if (!normalized || normalized.length < 3 || normalized.length > 5) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    list.push(normalized);
};

const buildFallbackTag = (idx) => {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const a = alpha[Math.floor(idx / (26 * 26)) % 26];
    const b = alpha[Math.floor(idx / 26) % 26];
    const c = alpha[idx % 26];
    return `X${a}${b}${c}`;
};

export const buildClanTagPool = (totalNeeded) => {
    const list = [];
    const seen = new Set();

    BASE_CLAN_TAGS.forEach((tag) => addTag(tag, seen, list));

    for (const stem of PROC_STEMS) {
        for (const ending of PROC_ENDINGS) {
            if (list.length >= totalNeeded) break;
            addTag(`${stem}${ending}`, seen, list);
        }
        if (list.length >= totalNeeded) break;
    }

    let fallbackIdx = 0;
    while (list.length < totalNeeded) {
        addTag(buildFallbackTag(fallbackIdx), seen, list);
        fallbackIdx += 1;
    }

    return shuffle(list).slice(0, totalNeeded);
};
