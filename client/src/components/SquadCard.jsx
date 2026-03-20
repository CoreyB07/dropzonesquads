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
    const memberLabel = memberCount === 1 ? 'member' : 'members';
    const opennessLabel = isOpen ? (normalize(audience) === 'open to all' ? 'Open' : 'Invite only') : 'Closed';
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
            className={`relative overflow-hidden cursor-default transition-all duration-200 p-4 sm:p-5 ${featured ? 'featured-card' : 'standard-squad-card'}`}
        >
            {featured && <div className="absolute top-0 left-0 h-[2px] w-full bg-premium-gold/70" />}

            <div className="relative z-10 space-y-3">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                        {featured && (
                            <span className="featured-badge mb-2 block w-max">Featured</span>
                        )}
                        <h3 className="text-lg sm:text-xl font-bold text-gray-100 leading-tight line-clamp-2" title={name}>
                            <SquadNameText name={name} />
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">
                            {gameMode} / {skillLevel}
                        </p>
                        {!isOpen && (
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold mt-1.5 text-red-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                Closed
                            </p>
                        )}
                    </div>
                    <div className={`shrink-0 px-2 py-1 rounded-md border text-[10px] font-semibold ${featured
                        ? 'bg-premium-gold/12 text-premium-gold-soft border-premium-gold-bright/35'
                        : 'bg-charcoal-dark border-military-gray text-gray-300'
                        }`}>
                        {memberCount} members
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center text-[10px] font-semibold tracking-wide pt-1 min-h-[26px]">
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
                        <span className="uppercase">{normalize(audience) === 'open to all' ? 'Open' : 'Invite only'}</span>
                    </div>
                    {micRequired && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 shrink-0 rounded border border-military-gray bg-charcoal-dark/50 text-gray-300">
                            <Mic className="w-3.5 h-3.5 text-gray-400" />
                            <span className="uppercase">Mic</span>
                        </div>
                    )}
                </div>

                <div className="pt-3 mt-1 border-t border-military-gray/50 flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCardOpen(); }}
                        className="flex-1 py-2.5 text-[12px] font-semibold rounded-md border border-military-gray bg-charcoal-dark text-gray-100"
                    >
                        View Squad
                    </button>
                    {isMemberOf(squad.id) ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/squad/${squad.id}/chat`, { state: { from: location.pathname } });
                            }}
                            className="px-3 py-2.5 text-[12px] font-semibold rounded-md bg-tactical-yellow text-charcoal-dark flex items-center gap-1.5"
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </button>
                    ) : canJoin ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onJoin(squad); }}
                            className="px-3 py-2.5 text-[12px] font-semibold rounded-md border border-military-gray bg-charcoal-dark text-gray-200"
                        >
                            Join
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SquadCard;
