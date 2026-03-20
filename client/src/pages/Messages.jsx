import React, { useMemo, useState } from 'react';
import ConversationList from '../components/messaging/ConversationList';
import ThreadView from '../components/messaging/ThreadView';

const seedConversations = [
  {
    id: 'conv-1',
    username: 'GhostRogue',
    preview: 'You still running ranked tonight?',
    time: '1:22 PM',
    unreadCount: 2,
    online: true,
    lastSeenLabel: 'Last seen just now'
  },
  {
    id: 'conv-2',
    username: 'AlphaSnipez',
    preview: 'GG last match. Let’s queue again later.',
    time: '11:05 AM',
    unreadCount: 0,
    online: false,
    lastSeenLabel: 'Last seen 8m ago'
  }
];

const seedMessages = {
  'conv-1': [
    { id: 'm1', body: 'Yo, we running tonight?', time: '1:16 PM', isMe: false },
    { id: 'm2', body: 'Yeah I’m down after 8.', time: '1:18 PM', isMe: true },
    { id: 'm3', body: 'Perfect. I’ll send invite.', time: '1:22 PM', isMe: false }
  ],
  'conv-2': [
    { id: 'm4', body: 'GG yesterday.', time: '11:02 AM', isMe: false },
    { id: 'm5', body: 'Facts, that was clean.', time: '11:05 AM', isMe: true }
  ]
};

const Messages = () => {
  const [conversations, setConversations] = useState(seedConversations);
  const [activeConversationId, setActiveConversationId] = useState(seedConversations[0]?.id || null);
  const [messagesByConversation, setMessagesByConversation] = useState(seedMessages);
  const [draft, setDraft] = useState('');

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const activeMessages = messagesByConversation[activeConversationId] || [];

  const handleSend = (event) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !activeConversationId) return;

    const now = new Date();
    const message = {
      id: `local-${now.getTime()}`,
      body: trimmed,
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      isMe: true
    };

    setMessagesByConversation((previous) => ({
      ...previous,
      [activeConversationId]: [...(previous[activeConversationId] || []), message]
    }));

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              preview: trimmed,
              time: message.time
            }
          : conversation
      )
    );

    setDraft('');
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-military-gray pb-3">
        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-wider text-white">Messages Redesign (Step 1)</h1>
        <p className="mt-1 text-[11px] sm:text-sm font-bold tracking-widest text-gray-400 uppercase">
          New two-pane scaffold with online status + composer shell
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
        />

        <ThreadView
          conversation={activeConversation}
          messages={activeMessages}
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
        />
      </div>
    </div>
  );
};

export default Messages;
