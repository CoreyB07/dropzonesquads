import React from 'react';
import { Users, Monitor, Gamepad2, Mic, Star, MessageCircle } from 'lucide-react';

const CHIP_STYLE_MAP = {
    platform: {
        pc: { color: '#FFD08A', borderColor: '#FF9A1F8C', backgroundColor: 'rgba(255,154,31,0.18)' },
        xbox: { color: '#B8FF6A', borderColor: '#7DFF1D99', backgroundColor: 'rgba(125,255,29,0.20)' },
        playstation: { color: '#8AC4FF', borderColor: '#3B82F69A', backgroundColor: 'rgba(59,130,246,0.18)' },
        crossplay: { color: '#BAE6FD', borderColor: '#0284C799', backgroundColor: 'rgba(2,132,199,0.18)' },
        default: { color: '#D1D5DB', borderColor: '#6B728099', backgroundColor: 'rgba(75,85,99,0.20)' }
    },
    mic: {
        on: { color: '#E5E7EB', borderColor: '#9CA3AF99', backgroundColor: 'rgba(156,163,175,0.18)' },
        off: { color: '#FF9AA8', borderColor: '#F43F5E99', backgroundColor: 'rgba(244,63,94,0.18)' }
    },
    skill: {
        ranked: { color: '#FF8A8A', borderColor: '#EF44449A', backgroundColor: 'rgba(239,68,68,0.18)' },
        'elite / pro': { color: '#FF8A8A', borderColor: '#EF44449A', backgroundColor: 'rgba(239,68,68,0.18)' },
        competitive: { color: '#FFE58A', borderColor: '#EAB3089A', backgroundColor: 'rgba(234,179,8,0.18)' },
        casual: { color: '#C4B5FD', borderColor: '#8B5CF69A', backgroundColor: 'rgba(139,92,246,0.18)' },
        default: { color: '#C4B5FD', borderColor: '#8B5CF69A', backgroundColor: 'rgba(139,92,246,0.18)' }
    },
    audience: {
        'women only': { color: '#FF9FE8', borderColor: '#EC48999A', backgroundColor: 'rgba(236,72,153,0.18)' },
        'men only': { color: '#A5B4FC', borderColor: '#6366F199', backgroundColor: 'rgba(99,102,241,0.18)' },
        'open to all': { color: '#CBFF8A', borderColor: '#84CC169A', backgroundColor: 'rgba(132,204,22,0.18)' },
        default: { color: '#CBFF8A', borderColor: '#84CC169A', backgroundColor: 'rgba(132,204,22,0.18)' }
    },
    comms: {
        discord: { color: '#DDD6FE', borderColor: '#7C3AED99', backgroundColor: 'rgba(124,58,237,0.18)' },
        game: { color: '#C5D2E9', borderColor: '#64748B99', backgroundColor: 'rgba(100,116,139,0.20)' },
        any: { color: '#F1F5F9', borderColor: '#CBD5E199', backgroundColor: 'rgba(203,213,225,0.20)' },
        default: { color: '#C5D2E9', borderColor: '#64748B99', backgroundColor: 'rgba(100,116,139,0.20)' }
    }
};

const normalize = (value) => String(value || '').toLowerCase().trim();

const getMappedStyle = (group, value) => {
    const key = normalize(value);
    return CHIP_STYLE_MAP[group][key] ?? CHIP_STYLE_MAP[group].default;
};

const SquadCard = ({ squad, onJoin, featured = false }) => {
    const {
        name,
        gameMode,
        platform,
        micRequired,
        skillLevel,
        audience = 'Open to All',
        comms = 'Game',
        playerCount,
        maxPlayers,
        acceptingPlayers = true
    } = squad;
    const isOpen = acceptingPlayers !== false && Number(playerCount || 0) < Number(maxPlayers || 0);
    const canJoin = Boolean(onJoin) && isOpen;

    const getPlatformIcon = (plt) => {
        switch (plt.toLowerCase()) {
            case 'pc': return <Monitor className="w-4 h-4" />;
            case 'crossplay': return <Users className="w-4 h-4" />;
            default: return <Gamepad2 className="w-4 h-4" />;
        }
    };

    const chipStyles = {
        platform: getMappedStyle('platform', platform),
        mic: getMappedStyle('mic', micRequired ? 'on' : 'off'),
        skill: getMappedStyle('skill', skillLevel),
        audience: getMappedStyle('audience', audience),
        comms: getMappedStyle('comms', comms)
    };

    return (
        <div
            className={`card-tactical group ${featured
                ? 'featured-card'
                : ''
                } ${canJoin
                    ? featured
                        ? 'cursor-pointer transition-all duration-300'
                        : 'cursor-pointer hover:border-tactical-yellow/40 transition-colors'
                    : ''
                }`}
            onClick={() => {
                if (canJoin) onJoin(squad);
            }}
            onKeyDown={(e) => {
                if (!canJoin) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onJoin(squad);
                }
            }}
            role={canJoin ? 'button' : undefined}
            tabIndex={canJoin ? 0 : -1}
            aria-label={canJoin ? `Open request modal for ${name}` : undefined}
        >
            <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        {featured && (
                            <span className="featured-badge">
                                Featured Squad
                            </span>
                        )}
                        <h3 className={`text-xl font-bold uppercase transition-colors ${featured ? 'text-white group-hover:text-amber-100' : 'text-white group-hover:text-tactical-yellow'}`}>{name}</h3>
                        <p className={`text-xs font-bold uppercase tracking-wider ${featured ? 'text-amber-100/85' : 'text-gray-500'}`}>{gameMode}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isOpen ? 'text-green-400' : 'text-red-400'}`}>
                            {isOpen ? 'Accepting Players' : 'Closed'}
                        </p>
                    </div>
                    <div className={`px-2 py-1 rounded border text-xs font-bold ${isOpen
                        ? featured
                            ? 'bg-amber-200/10 text-amber-100 border-amber-200/35'
                            : 'bg-tactical-yellow/10 text-tactical-yellow border-tactical-yellow/20'
                        : 'bg-red-500/10 text-red-300 border-red-500/30'
                        }`}>
                        {playerCount}/{maxPlayers} PLAYERS
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center text-[10px] font-bold tracking-wider">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border" style={chipStyles.platform}>
                        {getPlatformIcon(platform)}
                        <span className="uppercase">{platform}</span>
                    </div>
                    {micRequired && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border" style={chipStyles.mic}>
                            <Mic className="w-3.5 h-3.5" />
                            <span className="uppercase">Mic On</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border" style={chipStyles.skill}>
                        <Star className="w-3.5 h-3.5" />
                        <span className="uppercase">{skillLevel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border" style={chipStyles.audience}>
                        <Users className="w-3.5 h-3.5" />
                        <span className="uppercase">{audience}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border" style={chipStyles.comms}>
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="uppercase">{comms}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SquadCard;
