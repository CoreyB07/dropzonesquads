import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { Mail, Send, Shield, User, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/useToast';
import SupporterBadge from '../components/SupporterBadge';
import { MOCK_DM_MESSAGES, MOCK_INBOX } from '../utils/mockData';
import { markConversationRead } from '../utils/mailState';

/**
 * Gets or creates a conversation between two users.
 * Returns the conversation_id.
 */
const getOrCreateConversation = async (_myId, otherId) => {
    const { data, error } = await supabase
        .rpc('get_or_create_direct_conversation', { other_user_id: otherId });

    if (error) throw error;
    return data;
};

const DirectMessage = () => {
    const { id: otherUserId } = useParams();
    const { user, isSupabaseReady } = useAuth();
    const { error: showError } = useToast();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [otherProfile, setOtherProfile] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => {
        if (!user || !otherUserId) { setLoading(false); return; }

        let channel = null;

        const initDM = async () => {
            if (!isSupabaseReady && !user?.isDemo) { setLoading(false); return; }

            // Demo mode
            if (user?.isDemo) {
                const inboxEntry = MOCK_INBOX.find(c => c.userId === otherUserId);
                setOtherProfile({ username: inboxEntry?.username || 'Shadow_Ops', platform: 'PlayStation', is_supporter: !!inboxEntry?.is_supporter });
                setConversationId(`demo-conv-${otherUserId}`);
                const convo = MOCK_DM_MESSAGES?.[otherUserId] || [
                    { id: 'demo-dm-1', created_at: new Date(Date.now() - 900000).toISOString(), body: 'Hey, saw your squad post. Still looking?', sender_id: otherUserId, profiles: { username: inboxEntry?.username || 'Shadow_Ops', is_supporter: !!inboxEntry?.is_supporter } },
                    { id: 'demo-dm-2', created_at: new Date(Date.now() - 600000).toISOString(), body: 'Yeah, what platform are you on?', sender_id: user.id, profiles: { username: user.username, is_supporter: !!user.isSupporter } },
                ];
                setMessages(convo);
                setLoading(false);
                return;
            }

            try {
                // Fetch other user's profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, platform, supporter, is_supporter')
                    .eq('id', otherUserId)
                    .single();
                if (profile) setOtherProfile(profile);

                // Get or create conversation
                const convId = await getOrCreateConversation(user.id, otherUserId);
                setConversationId(convId);

                // Load messages
                const { data, error } = await supabase
                    .from('messages')
                    .select(`id, body, created_at, sender_id, profiles: sender_id(username, platform, supporter, is_supporter)`)
                    .eq('conversation_id', convId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                if (data) setMessages(data.reverse());

                // Realtime subscription
                channel = supabase
                    .channel(`dm-conv-${convId}`)
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
                        async (payload) => {
                            const { data: profileData } = await supabase
                                .from('profiles')
                                .select('username, platform, supporter, is_supporter')
                                .eq('id', payload.new.sender_id)
                                .single();
                            setMessages(prev => [...prev, { ...payload.new, profiles: profileData || { username: 'Unknown' } }]);
                        }
                    )
                    .subscribe();

            } catch (err) {
                console.error('Failed to load DM:', err);
                showError('Could not load message history.');
            } finally {
                setLoading(false);
            }
        };

        initDM();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [isSupabaseReady, user, otherUserId, showError]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    useEffect(() => {
        if (!user || !conversationId || loading) {
            return;
        }

        markConversationRead(user.id, conversationId, new Date().toISOString());
    }, [user, conversationId, messages, loading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!user) return;
        const trimmed = newMessage.trim();
        if (!trimmed) return;
        setNewMessage('');

        if (user.isDemo) {
            const createdAt = new Date().toISOString();
            setMessages(prev => [...prev, {
                id: `demo-${Date.now()}`,
                body: trimmed,
                created_at: createdAt,
                sender_id: user.id,
                profiles: { username: user.username, platform: user.platform || 'PC' }
            }]);
            if (conversationId) {
                markConversationRead(user.id, conversationId, createdAt);
            }
            return;
        }

        try {
            const convId = conversationId || await getOrCreateConversation(user.id, otherUserId);
            if (!conversationId) setConversationId(convId);

            const { error } = await supabase
                .from('messages')
                .insert({ conversation_id: convId, sender_id: user.id, body: trimmed });

            if (error) throw error;
            // Realtime handles UI update

            // Insert notification for the other user
            try {
                await supabase.from('notifications').insert({
                    recipient_id: otherUserId,
                    actor_id: user.id,
                    type: 'direct_message',
                    payload: {
                        preview: trimmed.substring(0, 100),
                        conversation_id: convId
                    }
                });
            } catch (notifErr) {
                console.warn('Failed to dispatch DM notification:', notifErr);
            }

        } catch (err) {
            console.error('Failed to send DM:', err);
            showError('Failed to send message.');
        }
    };

    const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <Shield className="w-16 h-16 text-tactical-yellow opacity-50" />
                <h2 className="text-xl font-black uppercase tracking-widest text-white">Secure Channel Locked</h2>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[85vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-charcoal-dark border border-military-gray rounded-t-xl p-4 flex items-center justify-between shadow-lg z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/inbox')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-military-gray border border-gray-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-widest flex items-center gap-1.5 text-white">
                            {(otherProfile?.supporter || otherProfile?.is_supporter) && <SupporterBadge />}
                            <span
                                className={(otherProfile?.supporter || otherProfile?.is_supporter) ? 'text-premium-glow inline-block' : ''}
                                data-text={(otherProfile?.supporter || otherProfile?.is_supporter) ? (otherProfile?.username || 'Loading...') : undefined}
                            >
                                {otherProfile?.username || 'Loading...'}
                            </span>
                        </h1>
                        <p className="text-[10px] text-tactical-yellow font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Shield className="w-3 h-3" /> Encrypted 1-on-1 Channel
                        </p>
                    </div>
                </div>
                <Link
                    to={`/user/${otherUserId}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-400/70 bg-gray-300 px-4 py-2 text-xs font-black uppercase tracking-widest text-charcoal-dark transition-colors hover:bg-gray-200"
                >
                    View Profile
                </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-charcoal-light border-x border-military-gray overflow-y-auto p-4 space-y-4 scrollbar-tactical">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-tactical-yellow animate-pulse">
                        <Shield className="w-8 h-8 animate-spin-slow opacity-50" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 opacity-50">
                        <Mail className="w-12 h-12 mb-2" />
                        <p className="font-bold tracking-widest uppercase text-sm">Channel Opened. Awaiting First Transmission.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user.id;
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
                            placeholder="Type an encrypted message..."
                            maxLength={500}
                            className="w-full bg-charcoal-light border border-military-gray rounded-lg py-3 pl-4 pr-12 text-white text-sm focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                    <button type="submit" disabled={!newMessage.trim()} className="bg-tactical-yellow text-charcoal-dark p-3 rounded-lg hover:bg-tactical-yellow-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed group flex-shrink-0">
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DirectMessage;
