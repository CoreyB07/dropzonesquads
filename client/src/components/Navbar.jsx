import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crosshair, LayoutDashboard, LogIn, UserPlus, Mail, Users, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMySquads } from '../context/MySquadsContext';
import { supabase } from '../utils/supabase';
import { getConversationReadAt, getSquadReadAt, isUnreadAfterReadAt, subscribeToMailReadState } from '../utils/mailState';
import SupporterBadge from './SupporterBadge';

const Navbar = () => {
    const { user, loading, isSupabaseReady } = useAuth();
    const { mySquads } = useMySquads();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    const getUnreadFromSquadMessages = useCallback(async (userId) => {
        if (!supabase) {
            return null;
        }

        const { data: membershipRows, error: membershipError } = await supabase
            .from('squad_members')
            .select('squad_id, squads(id, chat_conversation_id)')
            .eq('user_id', userId);

        if (membershipError) {
            console.error('Error checking squad memberships:', membershipError);
            return null;
        }

        const squadConversations = (membershipRows || [])
            .map((row) => {
                const squad = Array.isArray(row.squads) ? row.squads[0] : row.squads;
                return {
                    squadId: String(row.squad_id || squad?.id || ''),
                    conversationId: squad?.chat_conversation_id || null,
                };
            })
            .filter((row) => row.squadId && row.conversationId);

        if (squadConversations.length === 0) {
            return 0;
        }

        const conversationToSquad = new Map(
            squadConversations.map((row) => [row.conversationId, row.squadId])
        );

        const { data: latestMessages, error } = await supabase
            .from('messages')
            .select('conversation_id, created_at, sender_id')
            .in('conversation_id', squadConversations.map((row) => row.conversationId))
            .neq('sender_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error checking unread squad messages:', error);
            return null;
        }

        const latestPerConversation = new Map();
        (latestMessages || []).forEach((message) => {
            if (!latestPerConversation.has(message.conversation_id)) {
                latestPerConversation.set(message.conversation_id, message);
            }
        });

        const unreadSquadIds = new Set();
        latestPerConversation.forEach((message, conversationId) => {
            const squadId = conversationToSquad.get(conversationId);
            if (!squadId) {
                return;
            }

            const readAt = getSquadReadAt(userId, squadId);
            if (isUnreadAfterReadAt(message.created_at, readAt)) {
                unreadSquadIds.add(squadId);
            }
        });

        return unreadSquadIds.size;
    }, []);

    const getUnreadFromDirectMessages = useCallback(async (userId) => {
        if (!supabase) {
            return 0;
        }

        try {
            const { data: convData, error: convError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (convError || !convData || convData.length === 0) {
                if (convError) {
                    console.error('Error checking conversation participants:', convError);
                }
                return 0;
            }

            const convIds = convData.map((conv) => conv.conversation_id);
            const { data: latestMessages, error } = await supabase
                .from('messages')
                .select('conversation_id, created_at, sender_id')
                .in('conversation_id', convIds)
                .neq('sender_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error checking unread direct messages:', error);
                return 0;
            }

            const latestPerConversation = new Map();
            (latestMessages || []).forEach((message) => {
                if (!latestPerConversation.has(message.conversation_id)) {
                    latestPerConversation.set(message.conversation_id, message);
                }
            });

            return Array.from(latestPerConversation.values()).filter((message) => {
                const readAt = getConversationReadAt(userId, message.conversation_id);
                return isUnreadAfterReadAt(message.created_at, readAt);
            }).length;
        } catch (err) {
            console.error('Error checking unread direct messages:', err);
            return 0;
        }
    }, []);

    // Check for unread messages/notifications
    useEffect(() => {
        if (!user) {
            return;
        }

        let active = true;

        const checkUnread = async () => {
            if (!isSupabaseReady) {
                if (active) {
                    setUnreadCount(0);
                }
                return;
            }

            const notificationCount = await getUnreadFromSquadMessages(user.id);
            const directMessageCount = await getUnreadFromDirectMessages(user.id);

            if (active) {
                setUnreadCount((notificationCount ?? 0) + directMessageCount);
            }
        };

        checkUnread();
        const unsubscribeReadState = subscribeToMailReadState(user.id, checkUnread);
        const interval = setInterval(checkUnread, 30000);

        let notificationsChannel = null;
        let directMessagesChannel = null;

        if (isSupabaseReady && supabase) {
            notificationsChannel = supabase
                .channel(`navbar-notifications-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
                    () => {
                        checkUnread();
                    }
                )
                .subscribe();

            directMessagesChannel = supabase
                .channel(`navbar-direct-messages-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages' },
                    () => {
                        checkUnread();
                    }
                )
                .subscribe();
        }

        return () => {
            active = false;
            unsubscribeReadState();
            clearInterval(interval);
            if (notificationsChannel) {
                supabase.removeChannel(notificationsChannel);
            }
            if (directMessagesChannel) {
                supabase.removeChannel(directMessagesChannel);
            }
        };
    }, [user, isSupabaseReady, getUnreadFromDirectMessages, getUnreadFromSquadMessages, mySquads]);

    const hasUnread = unreadCount > 0;
    const displayUnreadCount = unreadCount > 9 ? '9+' : String(unreadCount);

    return (
        <nav className="bg-charcoal-light border-b border-military-gray sticky top-0 z-50">
            <div className="container mx-auto px-3 sm:px-4 flex justify-between items-center h-16 gap-2">
                <Link to="/" className="flex items-center gap-1.5 sm:gap-2 text-tactical-yellow font-bold text-lg sm:text-xl uppercase tracking-tighter shrink-0">
                    <Crosshair className="w-8 h-8" />
                    <span className="hidden md:inline">Drop Zone Squads</span>
                </Link>

                {/* Central Navigation */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    {loading ? (
                        <div className="text-xs font-black uppercase tracking-widest text-gray-500">
                            Syncing...
                        </div>
                    ) : user ? (
                        <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-gray-400">
                            {user?.isAdmin && (
                                <Link
                                    to="/admin"
                                    className="bg-charcoal-dark hover:bg-military-gray/40 px-3 py-2 rounded-md transition-all border border-military-gray text-gray-300 hover:text-white"
                                >
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">
                                        <LayoutDashboard className="w-3.5 h-3.5" />
                                        Admin
                                    </span>
                                </Link>
                            )}
                            <Link
                                to="/privacy"
                                className="bg-charcoal-dark hover:bg-military-gray/40 px-3 py-2 rounded-md transition-all border border-military-gray text-white"
                                title="Privacy & Info"
                            >
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">
                                    <Info className="w-3.5 h-3.5" />
                                    Privacy
                                </span>
                            </Link>
                            <Link
                                to="/my-squads"
                                className="bg-charcoal-dark hover:bg-military-gray/40 px-3 py-2 rounded-md transition-all border border-military-gray text-white"
                                title="My Squads"
                            >
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">
                                    <Users className="w-3.5 h-3.5" />
                                    My Squads
                                </span>
                            </Link>
                            <Link
                                to="/inbox"
                                className={`relative px-3 py-2 rounded-md transition-all border flex items-center gap-2 ${hasUnread && location.pathname !== '/inbox'
                                    ? 'bg-white/10 border-white/30 text-white shadow-[0_0_16px_rgba(255,255,255,0.1)]'
                                    : 'bg-charcoal-dark hover:bg-military-gray/40 border-military-gray text-white'
                                    }`}
                                title="Direct Messages"
                            >
                                <Mail className="w-4 h-4" />
                                {hasUnread && location.pathname !== '/inbox' && (
                                    <span className="absolute -top-2 -right-2 min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black leading-none ring-2 ring-charcoal-light">
                                        {displayUnreadCount}
                                    </span>
                                )}
                            </Link>

                            {/* Consolidated Inbox */}

                            <Link to="/profile" className="flex items-center gap-2 bg-military-gray/30 hover:bg-military-gray/50 px-4 py-2 rounded-md transition-all border border-military-gray">
                                <span className="font-bold text-xs uppercase flex items-center gap-1.5 transition-colors text-gray-300">
                                    {user?.isSupporter && <SupporterBadge />}
                                    <span
                                        className={user?.isSupporter ? 'text-premium-glow inline-block' : ''}
                                        data-text={user?.isSupporter ? user.username : undefined}
                                    >
                                        {user.username}
                                    </span>
                                </span>
                            </Link>
                        </div >
                    ) : (
                        <div className="flex items-center gap-1 p-1 rounded-xl border border-military-gray bg-charcoal-dark/70 shrink-0">
                            <Link
                                to="/auth?mode=login"
                                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all uppercase text-[10px] sm:text-[11px] font-black tracking-wide sm:tracking-widest"
                            >
                                <LogIn className="w-4 h-4" />
                                <span className="hidden sm:inline">Log In</span>
                            </Link>
                            <Link
                                to="/auth?mode=signup"
                                className="flex items-center gap-1 sm:gap-2 bg-white text-charcoal-dark font-black px-2.5 sm:px-4 py-2 rounded-lg hover:bg-[#fff5dc] transition-all uppercase text-[10px] sm:text-[11px] tracking-wide sm:tracking-widest"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Sign Up</span>
                            </Link>
                        </div>
                    )}
                </div >
            </div >
        </nav >
    );
};

export default Navbar;
