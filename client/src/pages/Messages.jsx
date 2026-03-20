import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ConversationList from '../components/messaging/ConversationList';
import ThreadView from '../components/messaging/ThreadView';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { supabase } from '../utils/supabase';
import { formatLastSeenLabel, isUserOnline, startPresenceHeartbeat } from '../utils/presence';
import { getConversationReadAt, isUnreadAfterReadAt, markConversationRead } from '../utils/mailState';

const PAGE_SIZE = 30;

const formatMessageTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  return sameDay
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const normalizeMessage = (msg, userId) => ({
  id: msg.id,
  body: msg.body,
  time: formatMessageTime(msg.created_at),
  isMe: msg.sender_id === userId,
  createdAt: msg.created_at
});

const Messages = () => {
  const { user, isSupabaseReady } = useAuth();
  const { error: showError } = useToast();

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [conversationsError, setConversationsError] = useState('');
  const [messagesError, setMessagesError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [threadCursorByConversation, setThreadCursorByConversation] = useState({});
  const [hasMoreByConversation, setHasMoreByConversation] = useState({});
  const [draft, setDraft] = useState('');
  const [mobileView, setMobileView] = useState('list');

  const refreshConversations = useCallback(async () => {
    if (!user || !isSupabaseReady || !supabase) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    try {
      setLoadingConversations(true);
      setConversationsError('');

      const { data: myRows, error: myRowsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myRowsError) throw myRowsError;

      const conversationIds = (myRows || []).map((row) => row.conversation_id).filter(Boolean);
      if (conversationIds.length === 0) {
        setConversations([]);
        setActiveConversationId(null);
        return;
      }

      const { data: participantRows, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds)
        .neq('user_id', user.id);

      if (participantError) throw participantError;

      const otherUserIds = [...new Set((participantRows || []).map((row) => row.user_id).filter(Boolean))];

      let profilesMap = new Map();
      if (otherUserIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, supporter, is_supporter, last_seen_at')
          .in('id', otherUserIds);

        if (profileError) throw profileError;
        profilesMap = new Map((profileRows || []).map((row) => [row.id, row]));
      }

      const { data: latestMessages, error: latestMessagesError } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at, sender_id')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (latestMessagesError) throw latestMessagesError;

      const convMap = new Map();
      (participantRows || []).forEach((row) => {
        const profile = profilesMap.get(row.user_id) || {
          id: row.user_id,
          username: 'Unknown',
          last_seen_at: null
        };

        convMap.set(row.conversation_id, {
          id: row.conversation_id,
          otherUserId: row.user_id,
          username: profile.username || 'Unknown',
          supporter: Boolean(profile.supporter || profile.is_supporter),
          lastSeenAt: profile.last_seen_at || null,
          preview: 'No messages yet',
          time: '',
          unreadCount: 0,
          lastMessageAt: null,
          iAmSender: false
        });
      });

      (latestMessages || []).forEach((msg) => {
        const existing = convMap.get(msg.conversation_id);
        if (!existing || existing.lastMessageAt) return;

        existing.preview = msg.body || 'Attachment';
        existing.time = formatMessageTime(msg.created_at);
        existing.lastMessageAt = msg.created_at;
        existing.iAmSender = msg.sender_id === user.id;
        existing.unreadCount =
          !existing.iAmSender &&
          isUnreadAfterReadAt(msg.created_at, getConversationReadAt(user.id, existing.id))
            ? 1
            : 0;
      });

      const nowMs = Date.now();
      const next = Array.from(convMap.values())
        .map((conversation) => ({
          ...conversation,
          online: isUserOnline(conversation.lastSeenAt, nowMs),
          lastSeenLabel: formatLastSeenLabel(conversation.lastSeenAt, nowMs)
        }))
        .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

      setConversations(next);
      setActiveConversationId((prev) => (prev && next.some((c) => c.id === prev) ? prev : next[0]?.id || null));
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
      setConversationsError('Could not load conversations');
      showError(`Could not load messages [${error?.code || 'no-code'}] ${error?.message || 'Unknown error'}`);
    } finally {
      setLoadingConversations(false);
    }
  }, [user, isSupabaseReady, showError]);

  const loadMessages = useCallback(async (conversationId, { older = false } = {}) => {
    if (!conversationId || !user || !isSupabaseReady || !supabase) return;

    const previousCursor = threadCursorByConversation[conversationId] || null;

    try {
      if (older) {
        setLoadingOlder(true);
      } else {
        setLoadingMessages(true);
        setMessagesError('');
      }

      let query = supabase
        .from('messages')
        .select('id, body, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (older && previousCursor) {
        query = query.lt('created_at', previousCursor);
      }

      const { data, error } = await query;
      if (error) throw error;

      const page = (data || []).slice().reverse().map((msg) => normalizeMessage(msg, user.id));
      const earliest = data?.length ? data[data.length - 1].created_at : previousCursor;

      if (older) {
        setMessagesByConversation((prev) => {
          const existing = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: [...page, ...existing]
          };
        });
      } else {
        setMessagesByConversation((prev) => ({ ...prev, [conversationId]: page }));
      }

      setThreadCursorByConversation((prev) => ({
        ...prev,
        [conversationId]: earliest || prev[conversationId] || null
      }));

      setHasMoreByConversation((prev) => ({
        ...prev,
        [conversationId]: (data || []).length === PAGE_SIZE
      }));

      if (!older) {
        markConversationRead(user.id, conversationId, new Date().toISOString());
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
          )
        );
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessagesError('Could not load this thread');
      showError(`Could not load thread [${error?.code || 'no-code'}] ${error?.message || 'Unknown error'}`);
    } finally {
      setLoadingMessages(false);
      setLoadingOlder(false);
    }
  }, [isSupabaseReady, showError, threadCursorByConversation, user]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    void loadMessages(activeConversationId, { older: false });
    setMobileView('thread');
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    if (!user || !isSupabaseReady || !supabase) return undefined;

    const stopHeartbeat = startPresenceHeartbeat(supabase);

    const participantsChannel = supabase
      .channel(`messages-participants-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` },
        () => {
          void refreshConversations();
        }
      )
      .subscribe();

    return () => {
      stopHeartbeat?.();
      supabase.removeChannel(participantsChannel);
    };
  }, [user, isSupabaseReady, refreshConversations]);

  useEffect(() => {
    if (!activeConversationId || !isSupabaseReady || !supabase) return undefined;

    const activeThreadChannel = supabase
      .channel(`messages-thread-${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`
        },
        () => {
          void loadMessages(activeConversationId, { older: false });
          void refreshConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activeThreadChannel);
    };
  }, [activeConversationId, isSupabaseReady, loadMessages, refreshConversations]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const intervalId = window.setInterval(() => {
      setConversations((prev) => {
        const nowMs = Date.now();
        return prev.map((conversation) => ({
          ...conversation,
          online: isUserOnline(conversation.lastSeenAt, nowMs),
          lastSeenLabel: formatLastSeenLabel(conversation.lastSeenAt, nowMs)
        }));
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = draft.trim();

    if (!trimmed || !activeConversationId || !user || !isSupabaseReady || !supabase) {
      return;
    }

    setDraft('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({ conversation_id: activeConversationId, sender_id: user.id, body: trimmed });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send message:', error);
      showError(`Message failed [${error?.code || 'no-code'}] ${error?.message || 'Unknown error'}`);
      setDraft(trimmed);
    }
  };

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const activeMessages = messagesByConversation[activeConversationId] || [];
  const hasMore = Boolean(hasMoreByConversation[activeConversationId]);

  if (!user) {
    return (
      <div className="rounded-xl border border-military-gray bg-charcoal-light p-6 text-sm font-bold uppercase tracking-widest text-gray-400">
        Sign in to access messages.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-military-gray pb-3">
        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-wider text-white">Messages</h1>
        <p className="mt-1 text-[11px] sm:text-sm font-bold tracking-widest text-gray-400 uppercase">
          Redesigned inbox with Supabase-backed threads
        </p>
      </div>

      <div className="hidden lg:flex flex-row gap-4">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          loading={loadingConversations}
          error={conversationsError}
        />

        <ThreadView
          conversation={activeConversation}
          messages={activeMessages}
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
          loading={loadingMessages}
          error={messagesError}
          hasMore={hasMore}
          loadingMore={loadingOlder}
          onLoadMore={() => loadMessages(activeConversationId, { older: true })}
        />
      </div>

      <div className="lg:hidden">
        {mobileView === 'list' || !activeConversation ? (
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(conversationId) => {
              setActiveConversationId(conversationId);
              setMobileView('thread');
            }}
            loading={loadingConversations}
            error={conversationsError}
            compact
          />
        ) : (
          <ThreadView
            conversation={activeConversation}
            messages={activeMessages}
            draft={draft}
            onDraftChange={setDraft}
            onSend={handleSend}
            loading={loadingMessages}
            error={messagesError}
            hasMore={hasMore}
            loadingMore={loadingOlder}
            onLoadMore={() => loadMessages(activeConversationId, { older: true })}
            onBackMobile={() => setMobileView('list')}
          />
        )}
      </div>
    </div>
  );
};

export default Messages;
