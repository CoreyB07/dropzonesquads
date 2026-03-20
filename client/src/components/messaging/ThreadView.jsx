import React from 'react';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import OnlineStatusBadge from './OnlineStatusBadge';

const ThreadView = ({ conversation, messages, draft, onDraftChange, onSend }) => {
  if (!conversation) {
    return (
      <section className="flex-1 border border-military-gray rounded-xl bg-charcoal-light flex items-center justify-center p-6">
        <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Select a conversation</p>
      </section>
    );
  }

  return (
    <section className="flex-1 border border-military-gray rounded-xl bg-charcoal-light overflow-hidden flex flex-col min-h-[62vh]">
      <header className="px-4 py-3 border-b border-military-gray bg-charcoal-dark flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-white">{conversation.username}</h2>
          <OnlineStatusBadge online={conversation.online} lastSeenLabel={conversation.lastSeenLabel} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-tactical">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">No messages yet</p>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} isMe={message.isMe} />
          ))
        )}
      </div>

      <MessageComposer
        value={draft}
        onChange={onDraftChange}
        onSend={onSend}
        disabled={!draft.trim()}
      />
    </section>
  );
};

export default ThreadView;
