import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crosshair, LayoutDashboard, LogIn, UserPlus, Mail, Users, Menu, X } from 'lucide-react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const hasUnread = unreadCount > 0;
    const displayUnreadCount = unreadCount > 9 ? '9+' : String(unreadCount);
    const utilityLinkClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-military-gray bg-charcoal-dark/80 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-200 transition-all hover:border-white/25 hover:bg-military-gray/40 hover:text-white';
    const primaryActionClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-charcoal-dark transition-all hover:bg-[#fff1c8]';
    const profileActionClass = 'inline-flex items-center gap-2 rounded-xl border border-military-gray bg-military-gray/30 px-4 py-2 transition-all hover:bg-military-gray/50';
    const inboxLinkClass = `relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${hasUnread && location.pathname !== '/inbox'
        ? 'bg-white/10 border-white/30 text-white shadow-[0_0_16px_rgba(255,255,255,0.1)]'
        : 'border-military-gray bg-charcoal-dark/80 text-white hover:border-white/25 hover:bg-military-gray/40'
        }`;

    return (
        <nav className="bg-charcoal-light border-b border-military-gray sticky top-0 z-50">
            <div className="container mx-auto px-3 sm:px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <Link to="/" className="flex min-w-0 items-center gap-2 text-tactical-yellow font-bold uppercase tracking-tight shrink">
                        <Crosshair className="h-7 w-7 sm:h-8 sm:w-8" />
                        <span className="min-w-0 text-[0.82rem] leading-none sm:text-xl">
                            <span className="block truncate">Drop Zone Squads</span>
                        </span>
                    </Link>

                    <div className="hidden min-w-0 items-center gap-3 md:flex">
                        {loading ? (
                            <div className="text-xs font-black uppercase tracking-widest text-gray-500">
                                Syncing...
                            </div>
                        ) : user ? (
                            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-400">
                                {user?.isAdmin && (
                                    <Link
                                        to="/admin"
                                        className={utilityLinkClass}
                                    >
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">
                                            <LayoutDashboard className="w-3.5 h-3.5" />
                                            Admin
                                        </span>
                                    </Link>
                                )}
                                <Link
                                    to="/my-squads"
                                    className={utilityLinkClass}
                                    title="My Squads"
                                >
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">
                                        <Users className="w-3.5 h-3.5" />
                                        My Squads
                                    </span>
                                </Link>
                                <Link
                                    to="/inbox"
                                    className={inboxLinkClass}
                                    title="Open inbox"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em]">Inbox</span>
                                    {hasUnread && location.pathname !== '/inbox' && (
                                        <span className="inline-flex min-w-[1.2rem] h-[1.2rem] px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black leading-none">
                                            {displayUnreadCount}
                                        </span>
                                    )}
                                </Link>

                                <Link to="/profile" className={profileActionClass}>
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
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 rounded-2xl border border-military-gray bg-charcoal-dark/70 p-1.5 shrink-0">
                                <Link
                                    to="/auth?mode=login"
                                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300 transition-all hover:bg-white/5 hover:text-white"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>Log In</span>
                                </Link>
                                <Link
                                    to="/auth?mode=signup"
                                    className={primaryActionClass}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Sign Up</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen((open) => !open)}
                            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-military-gray bg-charcoal-dark/80 text-white transition-all hover:border-white/25 hover:bg-military-gray/40"
                            aria-expanded={isMobileMenuOpen}
                            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            {user && hasUnread && location.pathname !== '/inbox' && (
                                <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black leading-none ring-2 ring-charcoal-light">
                                    {displayUnreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="mt-3 md:hidden">
                        <div className="rounded-[1.4rem] border border-military-gray/80 bg-[#0f1012]/95 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                            {loading ? (
                                <div className="px-2 py-3 text-xs font-black uppercase tracking-widest text-gray-500">
                                    Syncing...
                                </div>
                            ) : user ? (
                                <div className="space-y-3">
                                    <Link
                                        to="/inbox"
                                        className={`${inboxLinkClass} w-full justify-between rounded-2xl px-4 py-3`}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.18em]">Open Inbox</span>
                                        </span>
                                        {hasUnread ? (
                                            <span className="inline-flex min-w-[1.4rem] h-[1.4rem] px-1.5 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black leading-none">
                                                {displayUnreadCount}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Messages</span>
                                        )}
                                    </Link>

                                    <Link to="/profile" className={`${profileActionClass} w-full justify-between`}>
                                        <span className="font-bold text-xs uppercase flex items-center gap-1.5 transition-colors text-gray-300">
                                            {user?.isSupporter && <SupporterBadge />}
                                            <span
                                                className={user?.isSupporter ? 'text-premium-glow inline-block' : ''}
                                                data-text={user?.isSupporter ? user.username : undefined}
                                            >
                                                {user.username}
                                            </span>
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Profile</span>
                                    </Link>

                                    <div className="grid grid-cols-2 gap-2">
                                        {user?.isAdmin && (
                                            <Link to="/admin" className={utilityLinkClass}>
                                                <LayoutDashboard className="w-3.5 h-3.5" />
                                                <span>Admin</span>
                                            </Link>
                                        )}
                                        <Link to="/my-squads" className={utilityLinkClass}>
                                            <Users className="w-3.5 h-3.5" />
                                            <span>My Squads</span>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <Link to="/auth?mode=login" className={utilityLinkClass}>
                                        <LogIn className="w-4 h-4" />
                                        <span>Log In</span>
                                    </Link>
                                    <Link to="/auth?mode=signup" className={primaryActionClass}>
                                        <UserPlus className="w-4 h-4" />
                                        <span>Sign Up</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
