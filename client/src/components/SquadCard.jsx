import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Monitor, Gamepad2, Mic, MessageSquare, ChevronRight } from 'lucide-react';
import { useMySquads } from '../context/MySquadsContext';
import SquadNameText from './SquadNameText';

const normalize = (value) => String(value || '').toLowerCase().trim();

const SquadCard = ({ squad, onJoin }) => {
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

    const isLfg = listingType === 'player_looking_for_squad';
    const isOpen = acceptingPlayers !== false && (isLfg || Number(playerCount || 0) < Number(maxPlayers || 0));
    const canJoin = Boolean(onJoin) && isOpen;
    const memberCount = Math.max(Number(playerCount || (isLfg ? 1 : 0)), 0);
    const slotLimit = isLfg ? 'Any' : Math.max(Number(maxPlayers || 0), memberCount || 0);
    const opennessLabel = isOpen ? (normalize(audience) === 'open to all' ? 'Open squad' : 'Invite only') : 'Closed';
    const handleCardOpen = () => navigate(`/squad/${squad.id}`);

    const platformLabel = platform || 'Crossplay';
    const descriptorParts = [gameMode, skillLevel, `${comms} comms`, platformLabel].filter(Boolean);
    const descriptor = descriptorParts.join(' • ');
    const secondaryMeta = [
        `${memberCount}/${slotLimit} ${isLfg ? 'players' : 'slots'}`,
        micRequired ? 'Mic required' : null,
        isLfg ? 'Player post' : null
    ].filter(Boolean).join(' • ');

    const getPlatformIcon = (plt) => {
        switch ((plt || '').toLowerCase()) {
            case 'pc': return <Monitor className="h-3.5 w-3.5" />;
            case 'crossplay': return <Users className="h-3.5 w-3.5" />;
            default: return <Gamepad2 className="h-3.5 w-3.5" />;
        }
    };

    return (
        <div className="unified-squad-card group relative overflow-hidden cursor-default p-3 sm:p-4">
            <div className="relative z-10 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-premium-gold-bright/35 bg-premium-gold/10 text-premium-gold-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                                {getPlatformIcon(platformLabel)}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[15px] font-bold leading-tight text-gray-100 sm:text-lg" title={name}>
                                    <SquadNameText name={name} />
                                </h3>
                                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-gray-400 sm:text-[13px] sm:leading-5">
                                    {descriptor}
                                </p>
                                <p className="mt-1 text-[10px] text-gray-500 sm:text-[11px]">
                                    {secondaryMeta}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${isOpen
                        ? 'border-premium-gold-bright/35 bg-premium-gold/12 text-premium-gold-soft'
                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                        }`}>
                        {opennessLabel}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-military-gray/35 pt-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCardOpen(); }}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-military-gray bg-charcoal-dark px-3.5 py-2 text-[12px] font-semibold text-gray-100 transition-colors hover:border-premium-gold-bright/35 hover:text-white"
                    >
                        View Squad <ChevronRight className="h-3.5 w-3.5 text-gray-500 transition-colors group-hover:text-premium-gold-soft" />
                    </button>
                    {isMemberOf(squad.id) ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/squad/${squad.id}/chat`, { state: { from: location.pathname } });
                            }}
                            className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-tactical-yellow px-3.5 py-2 text-[12px] font-semibold text-charcoal-dark transition-colors hover:bg-tactical-yellow-hover sm:w-auto"
                        >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </button>
                    ) : canJoin ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onJoin(squad); }}
                            className="min-h-10 w-full rounded-lg bg-tactical-yellow px-3.5 py-2 text-[12px] font-semibold text-charcoal-dark transition-colors hover:bg-tactical-yellow-hover sm:w-auto"
                        >
                            Join Squad
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SquadCard;
