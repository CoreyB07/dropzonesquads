import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { fetchSquadMembers, getMyRoleInSquad } from '../utils/squadMembersApi';
import { normalizeSquad } from '../utils/squadsApi';
import { useAuth } from '../context/AuthContext';
import ApplyModal from '../components/ApplyModal';
import SupporterBadge from '../components/SupporterBadge';
import SquadNameText from '../components/SquadNameText';
import BadgeChip from '../components/BadgeChip';
import { fetchSquadMemberBadges } from '../utils/badgeApi';
import {
    Crown, Star, Users, User, Gamepad2, Monitor, Mic, MicOff,
    MessageCircle, UserPlus, ArrowLeft, Calendar, Tag,
    Send, ChevronRight, Target, Medal
} from 'lucide-react';


const RoleBadge = ({ role }) => {
    if (role === 'leader') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-red-500/35 text-red-300 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
            <Crown className="w-2.5 h-2.5 mb-0.5" /> Squad Leader
        </span>
    );
    if (role === 'co-leader') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-orange-300/45 text-orange-200 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
            <Star className="w-2.5 h-2.5 mb-0.5" /> Co-Leader
        </span>
    );
    if (role === 'member') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
            <User className="w-2.5 h-2.5 mb-0.5" /> Operator
        </span>
    );
    if (role === 'recruit') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-stone-500/30 text-stone-400 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
            <Target className="w-2.5 h-2.5 mb-0.5" /> Recruit
        </span>
    );
    if (role === 'veteran') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
            <Medal className="w-2.5 h-2.5 mb-0.5" /> Veteran
        </span>
    );
    return null;
};

const timeAgo = (isoString) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const SquadProfile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [squad, setSquad] = useState(null);
    const [members, setMembers] = useState([]);
    const [myRole, setMyRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applyOpen, setApplyOpen] = useState(false);
    const [showAuthNudge, setShowAuthNudge] = useState(false);
    const [memberBadges, setMemberBadges] = useState({});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data: squadData } = await supabase
                    .from('squads')
                    .select('*')
                    .eq('id', id)
                    .single();
                if (squadData) setSquad(normalizeSquad(squadData));

                const memberData = await fetchSquadMembers(id);
                setMembers(memberData);

                const badgeRows = await fetchSquadMemberBadges(id);
                const grouped = (badgeRows || []).reduce((acc, row) => {
                    const uid = row.user_id;
                    if (!uid || !row?.badge?.label) return acc;
                    acc[uid] = acc[uid] || [];
                    acc[uid].push({
                        id: row.badge_id,
                        label: row.badge.label,
                        category: row.badge.category
                    });
                    return acc;
                }, {});
                setMemberBadges(grouped);

                if (user?.id) {
                    const role = await getMyRoleInSquad(id, user.id);
                    setMyRole(role);
                }
            } catch (err) {
                console.error('Error loading squad profile:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, user]);

    const leaders = members.filter(m => m.role === 'leader' || m.role === 'co-leader');
    const handleMessageLeader = () => {
        if (!user) { setShowAuthNudge(true); return; }
        const leader = leaders[0];
        if (leader) navigate(`/dm/${leader.id}`);
    };

    if (loading) return (
        <div className="space-y-6 pb-20 animate-pulse">
            <div className="h-48 bg-charcoal-light rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-charcoal-light rounded-xl col-span-2" />
                <div className="h-24 bg-charcoal-light rounded-xl" />
            </div>
        </div>
    );

    if (!squad) return (
        <div className="text-center py-32 text-gray-500 font-bold uppercase tracking-widest">
            Squad not found
        </div>
    );

    const spotsLeft = (squad.maxPlayers || 4) - (squad.playerCount || 0);
    const isLeaderOrCoLeader = myRole === 'leader' || myRole === 'co-leader';
    const isCreator = squad.creatorId && user?.id && squad.creatorId === user.id;

    return (
        <div className="space-y-6 pb-20">
            {/* Back */}
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-black uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Squad Hero Header */}
            <section className="relative rounded-2xl border border-military-gray bg-charcoal-light overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-tactical-yellow/5 via-transparent to-transparent pointer-events-none" />
                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="space-y-3">
                            {/* Squad name */}
                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                                <SquadNameText name={squad.name} restClassName="text-white" />
                            </h1>
                            {/* Meta badges */}
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-dark border border-military-gray text-xs font-black text-gray-300 uppercase tracking-wider">
                                    <Gamepad2 className="w-3 h-3" /> {squad.gameMode}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-dark border border-military-gray text-xs font-black text-gray-300 uppercase tracking-wider">
                                    <Monitor className="w-3 h-3" /> {squad.platform}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${squad.acceptingPlayers
                                    ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                    : 'bg-red-500/10 border-red-500/40 text-red-400'
                                    }`}>
                                    <Users className="w-3 h-3" />
                                    {squad.acceptingPlayers ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} open` : 'Squad full'}
                                </span>
                                {squad.micRequired
                                    ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-dark border border-military-gray text-xs font-black text-gray-300 uppercase tracking-wider"><Mic className="w-3 h-3" /> Mic required</span>
                                    : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-dark border border-military-gray text-xs font-black text-gray-300 uppercase tracking-wider"><MicOff className="w-3 h-3" /> Mic optional</span>
                                }
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-dark border border-military-gray text-xs font-black text-gray-300 uppercase tracking-wider">
                                    {squad.skillLevel}
                                </span>
                            </div>
                            {/* Description */}
                            {squad.description && (
                                <p className="text-gray-300 text-sm leading-relaxed max-w-xl">{squad.description}</p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-3 min-w-[160px]">
                            {squad.acceptingPlayers && !isLeaderOrCoLeader && !isCreator && (
                                <button
                                    onClick={() => user ? setApplyOpen(true) : setShowAuthNudge(true)}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-tactical-yellow text-black font-black uppercase tracking-widest hover:bg-tactical-yellow-hover transition-colors"
                                >
                                    <UserPlus className="w-4 h-4" /> Request to Join
                                </button>
                            )}
                            {leaders.length > 0 && (
                                <button
                                    onClick={handleMessageLeader}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-military-gray bg-charcoal-dark text-white font-black uppercase tracking-widest hover:border-tactical-yellow-hover hover:text-tactical-yellow-hover transition-all"
                                >
                                    <MessageCircle className="w-4 h-4" /> Message Leader
                                </button>
                            )}
                            {(isLeaderOrCoLeader || isCreator) && (
                                <Link
                                    to={`/squad/${id}/manage`}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-tactical-yellow/50 bg-tactical-yellow/10 text-tactical-yellow font-black uppercase tracking-widest hover:border-tactical-yellow-hover/60 hover:bg-tactical-yellow-hover/15 hover:text-tactical-yellow-hover transition-colors"
                                >
                                    Manage Squad
                                </Link>
                            )}
                            {/* Guest sign-in nudge */}
                            {showAuthNudge && !user && (
                                <div className="rounded-xl border border-tactical-yellow/40 bg-tactical-yellow/10 px-4 py-3 text-center space-y-2">
                                    <p className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Free membership required</p>
                                    <p className="text-[11px] text-gray-300">
                                        You can browse squads and profiles freely. Join requests and direct messages require a member profile.
                                    </p>
                                    <Link
                                        to="/auth"
                                        className="block text-xs font-black uppercase tracking-widest text-black bg-tactical-yellow rounded-lg py-2 hover:bg-tactical-yellow-hover transition-colors"
                                    >
                                        Create Free Membership
                                    </Link>
                                    <button onClick={() => setShowAuthNudge(false)} className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {squad.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-military-gray/50">
                            <Tag className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                            {squad.tags.map(tag => (
                                <span key={tag} className="text-xs text-gray-500 font-bold uppercase tracking-wider">#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Squad comms column */}
                <div className="lg:col-span-2 space-y-4"> 
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Squad Comms</p>
                    <div className="bg-charcoal-light border border-military-gray rounded-xl p-6 space-y-3">
                        <p className="text-sm text-gray-300">Community comments were removed. Use private squad chat for all squad communication.</p>
                        <div>
                            <Link
                                to={`/squad/${id}/chat`}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-tactical-yellow text-black font-black uppercase tracking-widest hover:bg-tactical-yellow-hover transition-colors"
                            >
                                Open Squad Chat
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Members sidebar */}
                <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                        Members · {members.length}/{squad.maxPlayers || 4}
                    </p>
                    <div className="bg-charcoal-light border border-military-gray rounded-xl divide-y divide-military-gray/50">
                        {members.length === 0 && (
                            <div className="p-6 text-center text-gray-600 text-xs font-bold uppercase tracking-widest">
                                No members yet
                            </div>
                        )}
                        {members.map(member => (
                            <Link
                                key={member.id}
                                to={`/user/${member.id}`}
                                className="flex items-center justify-between px-4 py-3 hover:bg-charcoal-dark/50 transition-colors group"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className={`flex items-center gap-1.5 text-sm font-black transition-colors ${(member.is_supporter || member.supporter || member.isSupporter) ? 'text-white' : 'text-gray-500'}`}>
                                            {(member.is_supporter || member.supporter || member.isSupporter) && <SupporterBadge />}
                                            <span
                                                className={(member.is_supporter || member.supporter || member.isSupporter) ? 'text-premium-glow inline-block' : ''}
                                                data-text={(member.is_supporter || member.supporter || member.isSupporter) ? (member.username || 'Unknown') : undefined}
                                            >
                                                {member.username || 'Unknown'}
                                            </span>
                                        </p>
                                        <RoleBadge role={member.role} />
                                    </div>
                                    {member.platform && (
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{member.platform}</p>
                                    )}
                                    {(memberBadges[member.id] || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {(memberBadges[member.id] || []).slice(0, 3).map((badge) => (
                                                <BadgeChip key={`${member.id}-${badge.id}`} label={badge.label} category={badge.category} compact />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-tactical-yellow-hover transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {applyOpen && (
                <ApplyModal squad={squad} onClose={() => setApplyOpen(false)} />
            )}
        </div>
    );
};

export default SquadProfile;
