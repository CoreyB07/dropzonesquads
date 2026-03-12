import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { fetchUserSquads } from '../utils/squadMembersApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { MessageCircle, Monitor, Shield, Crown, ArrowLeft, ChevronRight, User, Target, Medal } from 'lucide-react';
import SquadNameText from '../components/SquadNameText';
import SupporterBadge from '../components/SupporterBadge';


const platformColors = {
    PC: 'text-blue-400',
    PlayStation: 'text-blue-300',
    Xbox: 'text-green-400',
    Crossplay: 'text-purple-400',
};

const UserProfile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isOwnProfile = user?.id === id;

    const [profile, setProfile] = useState(null);
    const [squads, setSquads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [friendship, setFriendship] = useState(null);
    const [friendshipLoading, setFriendshipLoading] = useState(true);
    const [friendBusy, setFriendBusy] = useState(false);
    const [sharedActivisionId, setSharedActivisionId] = useState(null);
    const { success, error: showError } = useToast();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, username, platform, avatar_url, bio, created_at, supporter, is_supporter')
                    .eq('id', id)
                    .single();
                setProfile(profileData);


                const userSquads = await fetchUserSquads(id);
                setSquads(userSquads);

                const { data: sharedId } = await supabase
                    .rpc('get_shared_activision_id', { target_user_id: id });
                setSharedActivisionId(sharedId || null);

                if (user?.id && id && user.id !== id) {
                    const { data: friendshipRows } = await supabase
                        .from('friendships')
                        .select('*')
                        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`)
                        .limit(1);
                    setFriendship(friendshipRows?.[0] || null);
                } else {
                    setFriendship(null);
                }

            } catch (err) {
                console.error('Error loading user profile:', err);
            } finally {
                setLoading(false);
                setFriendshipLoading(false);
            }
        };
        load();
    }, [id, user?.id]);


    const sendFriendRequest = async () => {
        if (!user) { navigate('/auth'); return; }
        if (!id || user.id === id) return;

        setFriendBusy(true);
        try {
            const { data, error } = await supabase
                .from('friendships')
                .insert({ requester_id: user.id, addressee_id: id, status: 'pending' })
                .select('*')
                .single();
            if (error) throw error;
            setFriendship(data);
            try {
                await supabase.from('notifications').insert({
                    recipient_id: id,
                    actor_id: user.id,
                    type: 'friend_request',
                    payload: { requester_id: user.id }
                });
            } catch {}
            success('Friend request sent.');
        } catch (err) {
            if (err?.code === '23505') {
                showError('A friend request already exists between you two.');
            } else {
                showError(err?.message || 'Unable to send friend request.');
            }
        } finally {
            setFriendBusy(false);
        }
    };

    const acceptFriendRequest = async () => {
        if (!friendship?.id) return;
        setFriendBusy(true);
        try {
            const { data, error } = await supabase
                .from('friendships')
                .update({ status: 'accepted' })
                .eq('id', friendship.id)
                .select('*')
                .single();
            if (error) throw error;
            setFriendship(data);
            try {
                await supabase.from('notifications').insert({
                    recipient_id: friendship.requester_id,
                    actor_id: user.id,
                    type: 'friend_request_accepted',
                    payload: { friendship_id: friendship.id }
                });
            } catch {}
            success('Friend request accepted.');
        } catch (err) {
            showError(err?.message || 'Unable to accept request.');
        } finally {
            setFriendBusy(false);
        }
    };

    const handleDM = () => {
        if (!user) { navigate('/auth'); return; }
        navigate(`/dm/${id}`);
    };

    if (loading) return (
        <div className="space-y-6 pb-20 animate-pulse">
            <div className="h-40 bg-charcoal-light rounded-2xl" />
            <div className="h-48 bg-charcoal-light rounded-xl" />
        </div>
    );

    if (!profile) return (
        <div className="text-center py-32 text-gray-500 font-bold uppercase tracking-widest">
            Player not found
        </div>
    );

    const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    return (
        <div className="space-y-6 pb-20 max-w-3xl mx-auto">
            {/* Back */}
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-black uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Profile Header */}
            <section className="relative rounded-2xl border border-military-gray bg-charcoal-light overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-military-gray/30 via-transparent to-transparent pointer-events-none" />
                <div className="p-6 md:p-8 flex flex-col sm:flex-row items-start gap-6">
                    {profile.avatar_url && (
                        <div className="w-20 h-20 rounded-2xl bg-charcoal-dark border border-military-gray flex items-center justify-center shrink-0 overflow-hidden">
                            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover rounded-2xl" />
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                                {(profile.is_supporter || profile.supporter) && <SupporterBadge />}
                                <span
                                    className={(profile.is_supporter || profile.supporter) ? 'text-premium-glow inline-block' : ''}
                                    data-text={(profile.is_supporter || profile.supporter) ? profile.username : undefined}
                                >
                                    {profile.username}
                                </span>
                            </h1>
                            {profile.platform && (
                                <span className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest ${platformColors[profile.platform] || 'text-gray-400'}`}>
                                    <Monitor className="w-3 h-3" /> {profile.platform}
                                </span>
                            )}
                        </div>

                        {sharedActivisionId && (
                            <p className="text-sm font-bold text-gray-400 font-mono">{sharedActivisionId}</p>
                        )}

                        {profile.bio && (
                            <p className="text-sm text-gray-400 leading-relaxed max-w-md">{profile.bio}</p>
                        )}

                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                            Member since {memberSince}
                        </p>
                    </div>

                    {/* Actions */}
                    {!isOwnProfile && (
                        <div className="flex flex-col gap-3 shrink-0">
                            <button
                                onClick={handleDM}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tactical-yellow text-black font-black uppercase tracking-widest hover:bg-tactical-yellow-hover transition-colors text-sm"
                            >
                                <MessageCircle className="w-4 h-4" /> Message
                            </button>
                            {!friendshipLoading && (!friendship || friendship.status === 'blocked') && (
                                <button
                                    onClick={sendFriendRequest}
                                    disabled={friendBusy}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-military-gray bg-charcoal-dark text-white font-black uppercase tracking-widest hover:border-tactical-yellow-hover hover:text-tactical-yellow-hover transition-all text-sm disabled:opacity-50"
                                >
                                    Add Friend
                                </button>
                            )}
                            {!friendshipLoading && friendship?.status === 'pending' && friendship?.addressee_id === user?.id && (
                                <button
                                    onClick={acceptFriendRequest}
                                    disabled={friendBusy}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-green-500/50 bg-green-500/10 text-green-300 font-black uppercase tracking-widest hover:bg-green-500/20 transition-all text-sm disabled:opacity-50"
                                >
                                    Accept Friend Request
                                </button>
                            )}
                            {!friendshipLoading && friendship?.status === 'pending' && friendship?.requester_id === user?.id && (
                                <span className="text-[11px] uppercase tracking-widest text-gray-400 font-bold text-center">Friend request pending</span>
                            )}
                            {!friendshipLoading && friendship?.status === 'accepted' && (
                                <span className="text-[11px] uppercase tracking-widest text-green-300 font-bold text-center">Friends</span>
                            )}
                        </div>
                    )}
                    {isOwnProfile && (
                        <Link
                            to="/profile"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-military-gray bg-charcoal-dark text-white font-black uppercase tracking-widest hover:border-tactical-yellow-hover hover:text-tactical-yellow-hover transition-all text-sm shrink-0"
                        >
                            Edit Profile
                        </Link>
                    )}
                </div>
            </section>

            {/* Squads Section */}
            <section className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Squads · {squads.length}
                </p>
                {squads.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 font-bold uppercase tracking-widest text-xs bg-charcoal-light rounded-xl border border-dashed border-military-gray">
                        Not in any squads yet
                    </div>
                ) : (
                    <div className="bg-charcoal-light border border-military-gray rounded-xl divide-y divide-military-gray/50">
                        {squads.map(sq => (
                            <Link
                                key={sq.id}
                                to={`/squad/${sq.id}`}
                                className="flex items-center justify-between px-5 py-4 hover:bg-charcoal-dark/50 transition-colors group"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <p className="font-black transition-colors uppercase">
                                            <SquadNameText name={sq.name} restClassName="text-white" />
                                        </p>
                                        {(sq.role === 'leader') && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-red-500/35 text-red-300 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
                                                <Crown className="w-2.5 h-2.5 mb-0.5" /> Squad Leader
                                            </span>
                                        )}
                                        {(sq.role === 'co-leader') && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-orange-300/45 text-orange-200 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
                                                <Shield className="w-2.5 h-2.5 mb-0.5" /> Co-Leader
                                            </span>
                                        )}
                                        {(sq.role === 'member') && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
                                                <User className="w-2.5 h-2.5 mb-0.5" /> Operator
                                            </span>
                                        )}
                                        {(sq.role === 'recruit') && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-stone-500/30 text-stone-400 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
                                                <Target className="w-2.5 h-2.5 mb-0.5" /> Recruit
                                            </span>
                                        )}
                                        {(sq.role === 'veteran') && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-none">
                                                <Medal className="w-2.5 h-2.5 mb-0.5" /> Veteran
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                        {sq.gameMode} · {sq.platform}
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-tactical-yellow-hover transition-colors" />
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default UserProfile;
