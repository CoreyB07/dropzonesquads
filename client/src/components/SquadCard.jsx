import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Monitor, Gamepad2, Mic, Star, MessageCircle, MessageSquare } from 'lucide-react';
import { useMySquads } from '../context/MySquadsContext';
import SquadNameText from './SquadNameText';

const normalize = (value) => String(value || '').toLowerCase().trim();

const SquadCard = ({ squad, onJoin, featured = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isMemberOf } = useMySquads();
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
        acceptingPlayers = true,
        listingType = 'squad_looking_for_players'
    } = squad;

    // An LFG post is 'player_looking_for_squad'
    const isLfg = listingType === 'player_looking_for_squad';
    // If it's an LFG post, the "player count" logic changes slightly:
    // They are open if maxPlayers is 99 (Any) or if playerCount < maxPlayers
    const isOpen = acceptingPlayers !== false && (isLfg || Number(playerCount || 0) < Number(maxPlayers || 0));
    const canJoin = Boolean(onJoin) && isOpen;
    const memberCount = Math.max(Number(playerCount || (isLfg ? 1 : 0)), 0);
    const handleCardOpen = () => navigate(`/squad/${squad.id}`);

    const getPlatformIcon = (plt) => {
        switch (plt.toLowerCase()) {
            case 'pc': return <Monitor className="w-4 h-4" />;
            case 'crossplay': return <Users className="w-4 h-4" />;
            default: return <Gamepad2 className="w-4 h-4" />;
        }
    };



    return (
        <div
            className={`card-tactical relative overflow-hidden group cursor-default transition-all duration-300 ${featured ? 'featured-card' : 'standard-squad-card'}`}
        >
            {/* Top Accent Strip */}
            {!featured && (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-slate-200/70 via-slate-300/80 to-sky-200/70 opacity-85" />
            )}

            <div className="relative z-10 space-y-4">
                {/* Header Row */}
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        {featured && (
                            <span className="featured-badge mb-2 block w-max">
                                Featured Squad
                            </span>
                        )}
                        <h3 className="text-xl font-black uppercase tracking-wide leading-tight line-clamp-2 min-h-[50px]" title={name}>
                            <SquadNameText name={name} />
                        </h3>
                        <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 truncate ${featured ? 'text-premium-gold-soft/85' : 'text-gray-500'}`}>
                            {gameMode} / {skillLevel}
                        </p>

                        {!isOpen && (
                            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mt-1.5 text-red-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                CLOSED
                            </p>
                        )}
                    </div>
                    <div className={`shrink-0 px-2.5 py-1 rounded border text-[10px] font-black tracking-widest uppercase ${featured
                        ? 'bg-premium-gold/12 text-premium-gold-soft border-premium-gold-bright/35'
                        : 'bg-slate-300/10 border-slate-300/20 text-slate-100 shadow-inner shadow-black/40'
                        }`}>
                        MEMBERS {memberCount}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center text-[10px] font-bold tracking-wider pt-1 h-[26px] overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 shrink-0 rounded border border-military-gray bg-charcoal-dark/50 text-gray-300">
                        {getPlatformIcon(platform)}
                        <span className="uppercase">{platform}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 shrink-0 rounded border border-military-gray bg-charcoal-dark/50 text-gray-300">
                        <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                        <span className="uppercase">{comms}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 shrink-0 rounded border border-military-gray bg-charcoal-dark/50 text-gray-300">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="uppercase">{audience}</span>
                    </div>
                    {micRequired && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 shrink-0 rounded border border-military-gray bg-charcoal-dark/50 text-gray-300">
                            <Mic className="w-3.5 h-3.5 text-gray-400" />
                            <span className="uppercase">Mic On</span>
                        </div>
                    )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-2 border-t border-military-gray/50 flex items-center justify-between gap-3 relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCardOpen(); }}
                        className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded ${featured ? 'bg-premium-gold/18 border border-premium-gold-bright/60 text-white shadow-[0_0_18px_rgba(183,121,31,0.24)]' : 'bg-slate-500 border border-slate-400 text-slate-100'}`}
                    >
                        View Squad
                    </button>
                    {isMemberOf(squad.id) ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/squad/${squad.id}/chat`, { state: { from: location.pathname } });
                            }}
                        className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded flex justify-center items-center gap-2 ${featured ? 'bg-premium-gold-bright text-charcoal-dark border border-premium-gold-bright/45' : 'bg-tactical-yellow text-charcoal-dark shadow-[0_0_10px_rgba(255,154,31,0.1)]'}`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Squad Chat
                        </button>
                    ) : canJoin ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onJoin(squad); }}
                            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded ${featured ? 'bg-premium-gold-bright text-charcoal-dark border border-premium-gold-bright/45 shadow-md' : 'bg-tactical-yellow text-white border border-tactical-yellow shadow-[0_0_10px_rgba(217,119,6,0.2)]'}`}
                        >
                            {isLfg ? 'Message Player' : 'Request to Join'}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SquadCard;
