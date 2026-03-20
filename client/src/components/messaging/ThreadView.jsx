import React from 'react';
import { ArrowLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import OnlineStatusBadge from './OnlineStatusBadge';

const ThreadView = ({
  conversation,
  messages,
  draft,
  onDraftChange,
  onSend,
  loading,
  error,
  hasMore,
  loadingMore,
  onLoadMore,
  onBackMobile
}) => {
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
        <div className="flex items-center gap-2">
          {onBackMobile && (
            <button
              type="button"
              onClick={onBackMobile}
              className="inline-flex lg:hidden items-center gap-1 rounded-lg border border-military-gray bg-charcoal-light px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">{conversation.username}</h2>
            <OnlineStatusBadge online={conversation.online} lastSeenLabel={conversation.lastSeenLabel} />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-tactical">
        {hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="mx-auto block rounded-lg border border-military-gray bg-charcoal-dark px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300 disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load older messages'}
          </button>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-11 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-300 font-bold uppercase tracking-widest">{error}</p>
        ) : messages.length === 0 ? (
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
