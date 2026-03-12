import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useMySquads } from '../context/MySquadsContext';
import SupporterBadge from '../components/SupporterBadge';
import SquadNameText from '../components/SquadNameText';
import { Mail, MessageSquare, Shield, ShieldAlert, UserRound, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/useToast';
import { MOCK_INBOX, MOCK_SQUAD_MESSAGES } from '../utils/mockData';
import { getConversationReadAt, getSquadReadAt, isUnreadAfterReadAt, subscribeToMailReadState } from '../utils/mailState';

const Inbox = () => {
    const { user, isSupabaseReady } = useAuth();
    const { mySquads } = useMySquads();
    const { error: showError } = useToast();
    const [conversations, setConversations] = useState([]);
    const [unreadSquadIds, setUnreadSquadIds] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        if (!isSupabaseReady && !user.isDemo) {
            setLoading(false);
            return;
        }

        if (user.isDemo) {
            const unreadSquads = (mySquads || [])
                .filter((squad) => {
                    const squadId = String(squad.id || '');
                    const messages = MOCK_SQUAD_MESSAGES[squadId] || [];
                    const latestIncomingMessage = [...messages]
                        .reverse()
                        .find((message) => message.sender_id !== user.id);

                    if (!latestIncomingMessage) {
                        return false;
                    }

                    const readAt = getSquadReadAt(user.id, squadId);
                    return isUnreadAfterReadAt(latestIncomingMessage.created_at, readAt);
                })
                .map((squad) => String(squad.id));
            setUnreadSquadIds(unreadSquads);

            setConversations(
                MOCK_INBOX.map((conversation) => ({
                    conversationId: `demo-conv-${conversation.userId}`,
                    other_user: {
                        id: conversation.userId,
                        username: conversation.username,
                        platform: 'PC',
                        is_supporter: !!conversation.is_supporter
                    },
                    lastMessage: conversation.lastMessage,
                    lastMessageTime: conversation.timestamp,
                    iAmSender: false,
                    unread: isUnreadAfterReadAt(
                        conversation.timestamp,
                        getConversationReadAt(user.id, `demo-conv-${conversation.userId}`)
                    )
                }))
            );
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

                const { data: allParticipants } = await supabase
                    .from('conversation_participants')
                    .select('conversation_id, user_id, profiles:user_id(id, username, platform, is_supporter, supporter)')
                    .in('conversation_id', convIds)
                    .neq('user_id', user.id);

                const { data: latestMessages } = await supabase
                    .from('messages')
                    .select('conversation_id, body, created_at, sender_id')
                    .in('conversation_id', convIds)
                    .order('created_at', { ascending: false });

                const convMap = new Map();
                (allParticipants || []).forEach((participant) => {
                    convMap.set(participant.conversation_id, {
                        conversationId: participant.conversation_id,
                        other_user: participant.profiles || { id: participant.user_id, username: 'Unknown', platform: 'PC' },
                        lastMessage: '',
                        lastMessageTime: null,
                        iAmSender: false,
                    });
                });

                (latestMessages || []).forEach((message) => {
                    const conversation = convMap.get(message.conversation_id);
                    if (conversation && !conversation.lastMessageTime) {
                        conversation.lastMessage = message.content;
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
            showError('Could not load your inbox.');
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

        if (user && !user.isDemo && isSupabaseReady && supabase) {
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
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end border-b border-military-gray pb-4">
                <div>
                    <h1 className="text-3xl font-black uppercase italic tracking-wider text-white flex items-center gap-3">
                        <Mail className="w-8 h-8 text-tactical-yellow" /> Secure Inbox
                    </h1>
                    <p className="text-sm font-bold tracking-widest text-gray-400 uppercase mt-1">Encrypted Direct Messages & Squad Comms</p>
                </div>
            </div>

            {mySquads && mySquads.length > 0 && (
                <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 pl-1">
                        <h2 className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Squad Comms</h2>
                        {unreadSquadCount > 0 && (
                            <span className="inline-flex min-w-[1.1rem] h-[1.1rem] px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black leading-none">
                                {unreadSquadCount > 9 ? '9+' : unreadSquadCount}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mySquads.map((squad) => {
                            const isUnreadSquad = unreadSquadIds.includes(String(squad.id));
                            return (
                                <Link
                                    key={squad.id}
                                    to={`/squad/${squad.id}/chat`}
                                    state={{ from: '/inbox' }}
                                    className={`rounded-xl p-4 flex items-center justify-between transition-all group ${isUnreadSquad
                                        ? 'bg-charcoal-dark border border-red-500/20'
                                        : 'bg-charcoal-light border border-military-gray hover:border-tactical-yellow-hover hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-all ${isUnreadSquad
                                            ? 'bg-white/10 border-white/30 text-white'
                                            : 'bg-charcoal-dark border-military-gray text-gray-400'
                                            }`}>
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase transition-colors">
                                                <SquadNameText
                                                    name={squad.name}
                                                    accentClassName={isUnreadSquad ? 'text-red-100' : 'text-squad-name'}
                                                    restClassName={isUnreadSquad ? 'text-red-100' : 'text-white'}
                                                />
                                            </h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                {squad.role === 'leader' ? 'Squad Leader' : squad.role === 'co-leader' ? 'Co-Leader' : squad.role === 'veteran' ? 'Veteran' : squad.role === 'recruit' ? 'Recruit' : 'Operator'} <span className="w-1 h-1 rounded-full bg-military-gray"></span> {squad.gameMode || 'Battle Royale'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <ChevronRight className={`w-4 h-4 transition-colors ${isUnreadSquad ? 'text-red-300' : 'text-gray-500 group-hover:text-tactical-yellow-hover'}`} />
                                        {isUnreadSquad && (
                                            <span className="absolute -top-1.5 -right-2.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500"></span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <div className="flex items-center gap-2 pl-1">
                    <h2 className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Direct Messages</h2>
                    {unreadDirectCount > 0 && (
                        <span className="inline-flex min-w-[1.1rem] h-[1.1rem] px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black leading-none">
                            {unreadDirectCount > 9 ? '9+' : unreadDirectCount}
                        </span>
                    )}
                </div>
                <div className="bg-charcoal-light border border-military-gray rounded-xl overflow-hidden shadow-2xl">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Shield className="w-8 h-8 text-tactical-yellow animate-spin-slow opacity-50" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-military-gray m-8 rounded-xl opacity-60">
                            <MessageSquare className="w-12 h-12 text-gray-500 mb-4" />
                            <h3 className="text-lg font-black tracking-widest uppercase text-gray-300">No Direct Messages</h3>
                            <p className="text-sm font-bold text-gray-500 max-w-sm mt-2">
                                Message a squad leader from any squad profile page to start a secure channel.
                            </p>
                        </div>
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
                                        className={`flex items-center gap-4 p-5 transition-colors group cursor-pointer ${isUnreadConversation
                                            ? 'bg-charcoal-dark/50 border-l-2 border-l-red-500/40'
                                            : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 relative ${isUnreadConversation
                                            ? 'bg-white/10 border-white/30 text-white'
                                            : 'bg-military-gray/40 border-gray-600 text-gray-200'
                                            }`}>
                                            <span className="text-sm font-black uppercase">{avatarInitial}</span>
                                            <UserRound className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-gray-400 bg-charcoal-light rounded-full p-[1px]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className={`font-black uppercase tracking-wider truncate transition-colors flex items-center gap-1.5 ${isUnreadConversation ? 'text-red-100' : 'text-gray-500'}`}>
                                                    {(conversation.other_user.is_supporter || conversation.other_user.supporter) && <SupporterBadge />}
                                                    <span
                                                        className={(conversation.other_user.is_supporter || conversation.other_user.supporter) ? 'text-premium-glow inline-block' : ''}
                                                        data-text={(conversation.other_user.is_supporter || conversation.other_user.supporter) ? username : undefined}
                                                    >
                                                        {username}
                                                    </span>
                                                </h3>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest flex-shrink-0 ${isUnreadConversation ? 'text-red-300' : 'text-gray-500'}`}>
                                                    {formatTime(conversation.lastMessageTime)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {conversation.iAmSender && (
                                                    <span className="text-[10px] font-bold text-tactical-yellow uppercase tracking-widest opacity-80">You:</span>
                                                )}
                                                <p className={`text-sm truncate font-medium ${isUnreadConversation ? 'text-red-100/90' : 'text-gray-400'}`}>
                                                    {conversation.lastMessage || 'No messages yet'}
                                                </p>
                                                {isUnreadConversation && (
                                                    <span className="ml-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0" title="Unread message"></span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Inbox;
