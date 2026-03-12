import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, Users, Shield, ArrowLeft } from 'lucide-react';
import SupporterBadge from '../components/SupporterBadge';
import SquadNameText from '../components/SquadNameText';
import { useToast } from '../context/useToast';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useMySquads } from '../context/MySquadsContext';
import { markSquadRead } from '../utils/mailState';

const SquadChat = () => {
    const { id: squadId } = useParams();
    const { user, isSupabaseReady } = useAuth();
    const { isMemberOf, loading: squadsLoading, mySquads } = useMySquads();
    const { error: showError } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const squadDetail = mySquads.find(s => String(s.id) === String(squadId));
    // The chat_conversation_id generated and assigned when the squad was created
    const conversationId = squadDetail?.chatConversationId || squadDetail?.chat_conversation_id;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        let channel = null;

        const fetchMessages = async () => {
            if (squadsLoading || !user) return;

            if (!isMemberOf(squadId) && !user.isAdmin) {
                setLoading(false);
                return;
            }

            if (!isSupabaseReady) {
                setLoading(false);
                return;
            }

            if (!conversationId) {
                console.warn("Squad has no chatConversationId associated with it.");
                setLoading(false);
                return;
            }

            try {
                // Fetch last 50 messages from direct_messages table (which doubles as group chat msgs when tied to a squad conversation)
                const { data, error } = await supabase
                    .from('messages')
                    .select('id, body, created_at, sender_id')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                if (data) {
                    const senderIds = [...new Set(data.map((m) => m.sender_id).filter(Boolean))];
                    let profilesById = {};

                    if (senderIds.length > 0) {
                        const { data: senderProfiles, error: profileError } = await supabase
                            .from('profiles')
                            .select('id, username, platform, supporter, is_supporter')
                            .in('id', senderIds);

                        if (!profileError && senderProfiles) {
                            profilesById = senderProfiles.reduce((acc, p) => {
                                acc[p.id] = p;
                                return acc;
                            }, {});
                        }
                    }

                    setMessages(
                        data
                            .map((m) => ({ ...m, profiles: profilesById[m.sender_id] || { username: 'Unknown', platform: 'PC' } }))
                            .reverse()
                    );
                }

                // Subscribe to realtime inserts
                channel = supabase
                    .channel(`squad-direct-messages-${conversationId}`)
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
                        async (payload) => {
                            const { data: profileData } = await supabase
                                .from('profiles')
                                .select('username, platform, supporter, is_supporter')
                                .eq('id', payload.new.sender_id)
                                .single();

                            setMessages(prev => [...prev, {
                                ...payload.new,
                                profiles: profileData || { username: 'Unknown', platform: 'PC' }
                            }]);
                        }
                    )
                    .subscribe();

            } catch (err) {
                console.error('Failed to load messages:', err);
                showError('Could not load chat history.');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [isSupabaseReady, user, squadsLoading, isMemberOf, squadId, conversationId, showError, squadDetail?.name]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    useEffect(() => {
        if (!user || !squadId || loading) {
            return;
        }

        markSquadRead(user.id, squadId, new Date().toISOString());
    }, [user, squadId, messages, loading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!user) return;
        if (!isMemberOf(squadId)) {
            showError("You must be a member of this squad to transmit.");
            return;
        }

        const trimmed = newMessage.trim();
        if (!trimmed) return;
        setNewMessage('');

        if (!conversationId) {
            showError("This squad was created before the Group Chat feature was enabled and cannot receive messages.");
            return;
        }

        try {
            // Insert into direct_messages
            const { error: msgErr } = await supabase
                .from('messages')
                .insert({ sender_id: user.id, body: trimmed, conversation_id: conversationId });

            if (msgErr) throw msgErr;

            // Optional: Insert notifications for all other squad members
            try {
                // Who are the members?
                const { data: members } = await supabase
                    .from('squad_members')
                    .select('user_id')
                    .eq('squad_id', squadId)
                    .neq('user_id', user.id);

                if (members && members.length > 0) {
                    const notifs = members.map(m => ({
                        recipient_id: m.user_id,
                        actor_id: user.id,
                        type: 'squad_message',
                        payload: {
                            preview: trimmed.substring(0, 100),
                            conversation_id: conversationId,
                            squad_id: squadId,
                            squad_name: squadDetail?.name || null
                        }
                    }));

                    await supabase.from('notifications').insert(notifs);
                }
            } catch (notifErr) {
                console.warn("Failed to dispatch notifications:", notifErr);
            }

        } catch (err) {
            console.error('Failed to send message:', err);
            showError(err.message || 'Failed to send message.');
        }
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (squadsLoading || loading) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-tactical-yellow animate-pulse">
                <Shield className="w-12 h-12 flex-shrink-0 animate-spin-slow opacity-50" />
            </div>
        );
    }

    if (!isMemberOf(squadId)) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <Shield className="w-16 h-16 text-tactical-yellow opacity-50" />
                <h2 className="text-xl font-black uppercase tracking-widest text-white">Access Denied</h2>
                <p className="text-sm font-bold tracking-widest text-gray-400 uppercase">You are not a member of this squad.</p>
                <button onClick={() => navigate(-1)} className="btn-tactical mt-4">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[85vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-charcoal-dark border border-military-gray rounded-t-xl p-4 flex items-center justify-between shadow-lg z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(location.state?.from || `/squad/${squadId}`)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                        title="Back to Squad Profile"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-lg bg-tactical-yellow/10 border border-tactical-yellow/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-tactical-yellow" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                            <SquadNameText name={squadDetail?.name || 'Squad'} restClassName="text-white" />
                            <span className="text-gray-500 font-normal">|</span>
                            <span>Comms</span>
                        </h1>
                        <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">
                            {'Secure Squad Channel'}
                        </p>
                    </div>
                </div>
                <Link
                    to={`/squad/${squadId}`}
                    className="inline-flex items-center justify-center rounded-lg border border-tactical-yellow/50 bg-tactical-yellow/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-tactical-yellow transition-colors hover:bg-tactical-yellow-hover hover:text-charcoal-dark"
                >
                    View Squad Profile
                </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-charcoal-light border-x border-military-gray overflow-y-auto p-4 space-y-4 relative scrollbar-tactical">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 opacity-50">
                        <MessageSquare className="w-12 h-12" />
                        <p className="font-bold tracking-widest uppercase text-sm">
                            {conversationId ? 'Channel Opened. Awaiting transmission.' : 'This squad cannot receive messages (legacy deployment).'}
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                                <div className="flex items-baseline gap-2 mb-1 px-1">
                                    <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isMe ? 'text-tactical-yellow' : 'text-gray-400'}`}>
                                        {(msg.profiles?.is_supporter || msg.profiles?.supporter) && <SupporterBadge />}
                                        <span
                                            className={(msg.profiles?.is_supporter || msg.profiles?.supporter) ? 'text-premium-glow inline-block' : ''}
                                            data-text={(msg.profiles?.is_supporter || msg.profiles?.supporter) ? (msg.profiles?.username || 'Unknown') : undefined}
                                        >
                                            {msg.profiles?.username || 'Unknown'}
                                        </span>
                                    </span>
                                    <span className="text-[9px] text-gray-600 font-bold">{formatTime(msg.created_at)}</span>
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-[75%] text-sm font-medium leading-relaxed break-words shadow-md ${isMe
                                    ? 'bg-tactical-yellow text-charcoal-dark font-bold rounded-tr-sm'
                                    : 'bg-charcoal-dark border border-military-gray text-gray-200 rounded-tl-sm'
                                    }`}>
                                    {msg.body}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-charcoal-dark border border-military-gray rounded-b-xl p-4 shadow-lg z-10">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a secure message..."
                            maxLength={280}
                            disabled={!conversationId}
                            className="w-full bg-charcoal-light border border-military-gray rounded-lg py-3 pl-4 pr-12 text-white text-sm focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">
                            {newMessage.length}/280
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !conversationId}
                        className="bg-tactical-yellow text-charcoal-dark p-3 rounded-lg hover:bg-tactical-yellow-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed group flex-shrink-0"
                    >
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SquadChat;
