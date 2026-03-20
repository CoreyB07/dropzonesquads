import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useMySquads } from '../context/MySquadsContext';
import SupporterBadge from '../components/SupporterBadge';
import SquadNameText from '../components/SquadNameText';
import { Mail, MessageSquare, Shield, ShieldAlert, UserRound, Users, ChevronRight, Bell, CheckCircle2, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/useToast';
import { getConversationReadAt, getSquadReadAt, isUnreadAfterReadAt, subscribeToMailReadState } from '../utils/mailState';

const Inbox = () => {
    const { user, isSupabaseReady, applications } = useAuth();
    const { mySquads } = useMySquads();
    const { error: showError } = useToast();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [unreadSquadIds, setUnreadSquadIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('all');

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        if (!isSupabaseReady) {
            setLoading(false);
            return;
        }

        try {
            const { data: partRows, error: partErr } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', user.id);

            if (partErr) throw partErr;

            if (!partRows || partRows.length === 0) {
                setConversations([]);
            } else {
                const convIds = partRows.map((row) => row.conversation_id);

                const { data: allParticipants, error: participantsError } = await supabase
                    .from('conversation_participants')
                    .select('conversation_id, user_id')
                    .in('conversation_id', convIds)
                    .neq('user_id', user.id);

                if (participantsError) throw participantsError;

                const otherUserIds = Array.from(new Set((allParticipants || []).map((participant) => participant.user_id)));
                let profileMap = new Map();

                if (otherUserIds.length > 0) {
                    const { data: profileRows, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, username, platform, is_supporter, supporter')
                        .in('id', otherUserIds);

                    if (profilesError) throw profilesError;

                    profileMap = new Map((profileRows || []).map((row) => [row.id, row]));
                }

                const { data: latestMessages } = await supabase
                    .from('messages')
                    .select('conversation_id, body, created_at, sender_id')
                    .in('conversation_id', convIds)
                    .order('created_at', { ascending: false });

                const convMap = new Map();
                (allParticipants || []).forEach((participant) => {
                    convMap.set(participant.conversation_id, {
                        conversationId: participant.conversation_id,
                        other_user: profileMap.get(participant.user_id) || { id: participant.user_id, username: 'Unknown', platform: 'PC' },
                        lastMessage: '',
                        lastMessageTime: null,
                        iAmSender: false,
                    });
                });

                (latestMessages || []).forEach((message) => {
                    const conversation = convMap.get(message.conversation_id);
                    if (conversation && !conversation.lastMessageTime) {
                        conversation.lastMessage = message.body;
                        conversation.lastMessageTime = message.created_at;
                        conversation.iAmSender = message.sender_id === user.id;
                    }
                });

                setConversations(
                    Array.from(convMap.values())
                        .map((conversation) => ({
                            ...conversation,
                            unread: Boolean(
                                !conversation.iAmSender &&
                                isUnreadAfterReadAt(
                                    conversation.lastMessageTime,
                                    getConversationReadAt(user.id, conversation.conversationId)
                                )
                            )
                        }))
                        .sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0))
                );
            }


            const { data: notifData, error: notifErr } = await supabase
                .from('notifications')
                .select('id, recipient_id, actor_id, type, payload, read_at, created_at')
                .eq('recipient_id', user.id)
                .order('created_at', { ascending: false })
                .limit(25);
            if (notifErr) throw notifErr;

            const actorIds = Array.from(new Set((notifData || []).map((n) => n.actor_id).filter(Boolean)));
            let actorMap = new Map();
            if (actorIds.length > 0) {
                const { data: actorProfiles, error: actorErr } = await supabase
                    .from('profiles')
                    .select('id, username')
                    .in('id', actorIds);
                if (actorErr) throw actorErr;
                actorMap = new Map((actorProfiles || []).map((row) => [row.id, row]));
            }

            setNotifications((notifData || []).map((n) => ({
                ...n,
                actor: actorMap.get(n.actor_id) || null
            })));

                        const squadConversations = (mySquads || [])
                .map((squad) => ({
                    squadId: String(squad.id || ''),
                    conversationId: squad.chatConversationId || squad.chat_conversation_id || null,
                }))
                .filter((squad) => squad.squadId && squad.conversationId);

            if (squadConversations.length === 0) {
                setUnreadSquadIds([]);
            } else {
                const conversationToSquad = new Map(
                    squadConversations.map((squad) => [squad.conversationId, squad.squadId])
                );

                const { data: latestSquadMessages, error: squadMessageError } = await supabase
                    .from('messages')
                    .select('conversation_id, created_at, sender_id')
                    .in('conversation_id', squadConversations.map((squad) => squad.conversationId))
                    .neq('sender_id', user.id)
                    .order('created_at', { ascending: false });

                if (squadMessageError) {
                    throw squadMessageError;
                }

                const latestPerConversation = new Map();
                (latestSquadMessages || []).forEach((message) => {
                    if (!latestPerConversation.has(message.conversation_id)) {
                        latestPerConversation.set(message.conversation_id, message);
                    }
                });

                setUnreadSquadIds(
                    Array.from(
                        new Set(
                            Array.from(latestPerConversation.values())
                                .filter((message) => {
                                    const squadId = conversationToSquad.get(message.conversation_id);
                                    if (!squadId) {
                                        return false;
                                    }

                                    const readAt = getSquadReadAt(user.id, squadId);
                                    return isUnreadAfterReadAt(message.created_at, readAt);
                                })
                                .map((message) => conversationToSquad.get(message.conversation_id))
                                .filter(Boolean)
                        )
                    )
                );
            }
        } catch (err) {
            console.error('Fetch Inbox error:', err);
            const code = err?.code || 'no-code';
            const msg = err?.message || 'unknown error';
            const details = err?.details ? ` | details: ${err.details}` : '';
            const hint = err?.hint ? ` | hint: ${err.hint}` : '';
            showError(`Could not load your inbox [${code}] ${msg}${details}${hint}`);
        } finally {
            setLoading(false);
        }
    }, [user, isSupabaseReady, showError, mySquads]);

    useEffect(() => {
        fetchConversations();
        const unsubscribeReadState = user ? subscribeToMailReadState(user.id, fetchConversations) : () => { };

        let directMessagesChannel = null;
        let participantsChannel = null;
        let squadMembersChannel = null;

        if (user && isSupabaseReady && supabase) {
            directMessagesChannel = supabase
                .channel(`inbox-direct-messages-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages' },
                    () => {
                        fetchConversations();
                    }
                )
                .subscribe();

            participantsChannel = supabase
                .channel(`inbox-conversation-participants-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` },
                    () => {
                        fetchConversations();
                    }
                )
                .subscribe();

            squadMembersChannel = supabase
                .channel(`inbox-squad-members-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'squad_members', filter: `user_id=eq.${user.id}` },
                    () => {
                        fetchConversations();
                    }
                )
                .subscribe();
        }

        return () => {
            unsubscribeReadState();
            if (directMessagesChannel) {
                supabase.removeChannel(directMessagesChannel);
            }
            if (participantsChannel) {
                supabase.removeChannel(participantsChannel);
            }
            if (squadMembersChannel) {
                supabase.removeChannel(squadMembersChannel);
            }
        };
    }, [fetchConversations, user, isSupabaseReady]);


    const markNotificationRead = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id', notificationId)
                .eq('recipient_id', user.id);
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n));
        } catch (err) {
            console.error('Failed to mark notification read:', err);
        }
    };

    const handleNotificationClick = async (notification) => {
        await markNotificationRead(notification.id);

        const squadId = notification?.payload?.squad_id;
        const actorId = notification?.actor_id;

        if (notification.type === 'direct_message' && actorId) {
            navigate(`/dm/${actorId}`);
            return;
        }

        if (notification.type === 'squad_join_request' && squadId) {
            navigate(`/squad/${squadId}/manage`);
            return;
        }

        if ((notification.type === 'squad_join_request_accepted' || notification.type === 'squad_join_request_rejected') && squadId) {
            navigate(`/squad/${squadId}`);
            return;
        }

        if (notification.type === 'squad_message' && squadId) {
            navigate(`/squad/${squadId}/chat`);
            return;
        }

        if ((notification.type === 'friend_request' || notification.type === 'friend_request_accepted') && actorId) {
            navigate(`/user/${actorId}`);
        }
    };

    const notificationLabel = (n) => {
        const actor = n.actor?.username || 'Someone';
        if (n.type === 'friend_request') return `${actor} sent you a friend request`;
        if (n.type === 'friend_request_accepted') return `${actor} accepted your friend request`;
        if (n.type === 'squad_join_request') return `${actor} requested to join ${n.payload?.squad_name || 'your squad'}`;
        if (n.type === 'squad_join_request_accepted') return `Your join request was accepted for ${n.payload?.squad_name || 'a squad'}`;
        if (n.type === 'squad_join_request_rejected') return `Your join request was rejected for ${n.payload?.squad_name || 'a squad'}`;
        if (n.type === 'direct_message') return `${actor} sent you a direct message`;
        if (n.type === 'squad_message') return `${actor} posted in squad chat`;
        return n.type;
    };

    const notificationMeta = (notification) => {
        if (notification.type === 'direct_message') {
            return { icon: Mail, actionLabel: 'Open chat' };
        }

        if (notification.type === 'squad_message') {
            return { icon: MessageSquare, actionLabel: 'Open chat' };
        }

        if (notification.type === 'squad_join_request') {
            return { icon: ShieldAlert, actionLabel: 'Review' };
        }

        if (notification.type === 'squad_join_request_accepted' || notification.type === 'squad_join_request_rejected') {
            return { icon: CheckCircle2, actionLabel: 'View squad' };
        }

        if (notification.type === 'friend_request' || notification.type === 'friend_request_accepted') {
            return { icon: UserPlus, actionLabel: 'View profile' };
        }

        return { icon: Bell, actionLabel: 'Open' };
    };

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
        return isToday
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const unreadSquadCount = unreadSquadIds.length;
    const unreadDirectCount = conversations.filter((conversation) => conversation.unread).length;
    const unreadNotificationCount = notifications.filter((n) => !n.read_at).length;
    const pendingJoinRequestCount = (applications || []).filter(
        (app) => app.status === 'pending' && app.squadCreatorUserId === user?.id
    ).length;

    const visibleSquads = (mySquads || []).slice(0, 4);
    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'dm', label: 'Direct Messages', count: unreadDirectCount },
        { key: 'squad', label: 'Squad Chats', count: unreadSquadCount },
        { key: 'requests', label: 'Requests', count: pendingJoinRequestCount },
        { key: 'notifications', label: 'Notifications', count: unreadNotificationCount },
    ];

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-tactical-yellow opacity-50" />
                <h2 className="text-xl font-black uppercase tracking-widest text-white">Access Denied</h2>
                <p className="text-gray-400 font-bold tracking-wider">You must be deployed to access secure comms.</p>
                <Link to="/auth?mode=login" className="px-6 py-2 bg-tactical-yellow text-charcoal-dark font-black uppercase tracking-widest rounded-lg hover:bg-tactical-yellow-hover transition-colors">
                    Log In
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-military-gray pb-3">
                <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-wider text-white flex items-center gap-2.5">
                    <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-tactical-yellow" /> Secure Inbox
                </h1>
                <p className="mt-1 text-[10px] sm:text-xs font-bold tracking-widest text-gray-500 uppercase">Direct messages first · mobile focused</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === tab.key
                            ? 'border-tactical-yellow bg-tactical-yellow/15 text-tactical-yellow'
                            : 'border-military-gray bg-charcoal-dark text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && <span className="ml-1 text-red-300">({tab.count > 9 ? '9+' : tab.count})</span>}
                    </button>
                ))}
            </div>

            {(activeTab === 'all' || activeTab === 'dm') && (
                <section className="bg-charcoal-light border border-military-gray rounded-xl overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-military-gray bg-charcoal-dark flex items-center justify-between">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-tactical-yellow">Direct Messages</h2>
                        {unreadDirectCount > 0 && <span className="text-[10px] font-black text-red-300">{unreadDirectCount} unread</span>}
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center h-32"><Shield className="w-6 h-6 text-tactical-yellow animate-spin-slow opacity-50" /></div>
                    ) : conversations.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-500 font-bold uppercase tracking-widest">No direct messages yet</div>
                    ) : (
                        <div className="divide-y divide-military-gray/50">
                            {conversations.map((conversation, idx) => {
                                const isUnreadConversation = Boolean(conversation.unread);
                                const username = conversation.other_user.username || 'Unknown';
                                const avatarInitial = username.charAt(0).toUpperCase();
                                return (
                                    <Link
                                        to={`/dm/${conversation.other_user.id}`}
                                        key={conversation.conversationId || idx}
                                        className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${isUnreadConversation ? 'bg-charcoal-dark/50' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="w-9 h-9 rounded-lg border border-military-gray bg-charcoal-dark flex items-center justify-center text-xs font-black text-white relative">
                                            {avatarInitial}
                                            <UserRound className="absolute -bottom-1 -right-1 w-3 h-3 text-gray-400 bg-charcoal-light rounded-full p-[1px]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`truncate text-xs font-black uppercase tracking-wider flex items-center gap-1 ${isUnreadConversation ? 'text-red-100' : 'text-white'}`}>
                                                    {(conversation.other_user.is_supporter || conversation.other_user.supporter) && <SupporterBadge />}
                                                    {username}
                                                </p>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">
                                                {conversation.iAmSender ? 'You: ' : ''}{conversation.lastMessage || 'No messages yet'}
                                            </p>
                                        </div>
                                        {isUnreadConversation && <span className="h-2 w-2 rounded-full bg-red-500" />}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {(activeTab === 'all' || activeTab === 'squad') && mySquads && mySquads.length > 0 && (
                <section className="bg-charcoal-light border border-military-gray rounded-xl overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-military-gray bg-charcoal-dark flex items-center justify-between">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-tactical-yellow">Squad Chats</h2>
                        <span className="text-[10px] text-gray-500 font-black">Showing {visibleSquads.length} of {mySquads.length}</span>
                    </div>
                    <div className="divide-y divide-military-gray/50">
                        {visibleSquads.map((squad) => {
                            const isUnreadSquad = unreadSquadIds.includes(String(squad.id));
                            return (
                                <Link key={squad.id} to={`/squad/${squad.id}/chat`} state={{ from: '/inbox' }} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-white/5">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-black uppercase tracking-wider text-white">
                                            <SquadNameText name={squad.name} restClassName="text-white" />
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{squad.gameMode || 'Battle Royale'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isUnreadSquad && <span className="h-2 w-2 rounded-full bg-red-500" />}
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {(activeTab === 'all' || activeTab === 'requests') && (
                <section className="bg-charcoal-light border border-military-gray rounded-xl overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-military-gray bg-charcoal-dark flex items-center justify-between">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-tactical-yellow">Requests</h2>
                        <span className="text-[10px] font-black text-gray-500">{pendingJoinRequestCount} pending</span>
                    </div>
                    <button type="button" onClick={() => navigate('/my-squads')} className="w-full text-left px-3 py-3 hover:bg-white/5">
                        <p className="text-sm text-white font-bold">Review squad join requests</p>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">Open my squads to manage applications</p>
                    </button>
                </section>
            )}

            {(activeTab === 'all' || activeTab === 'notifications') && (
                <section className="bg-charcoal-light border border-military-gray rounded-xl overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-military-gray bg-charcoal-dark flex items-center justify-between">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-tactical-yellow">Notifications</h2>
                        {unreadNotificationCount > 0 && <span className="text-[10px] font-black text-red-300">{unreadNotificationCount} unread</span>}
                    </div>
                    {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 font-bold uppercase tracking-widest">No notifications yet</div>
                    ) : (
                        <div className="divide-y divide-military-gray/50">
                            {notifications.map((n) => {
                                const meta = notificationMeta(n);
                                const Icon = meta.icon;
                                return (
                                    <button key={n.id} onClick={() => handleNotificationClick(n)} className={`w-full text-left px-3 py-2.5 hover:bg-white/5 ${!n.read_at ? 'bg-charcoal-dark/40' : ''}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <div className="h-7 w-7 rounded-lg border border-military-gray bg-charcoal-dark flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-gray-400" /></div>
                                                <div className="min-w-0">
                                                    <p className={`text-xs truncate ${!n.read_at ? 'text-white font-bold' : 'text-gray-300'}`}>{notificationLabel(n)}</p>
                                                    <p className="text-[10px] uppercase tracking-widest text-gray-500">{formatTime(n.created_at)}</p>
                                                </div>
                                            </div>
                                            {!n.read_at && <span className="h-2 w-2 rounded-full bg-red-500 mt-1" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default Inbox;
