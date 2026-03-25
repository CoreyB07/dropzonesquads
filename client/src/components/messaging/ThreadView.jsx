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
  onBackMobile,
  onAttachFile,
  attachmentLabel
}) => {
  if (!conversation) {
    return (
      <section className="flex min-h-[62vh] flex-1 items-center justify-center rounded-2xl border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 text-center shadow-[0_16px_40px_rgba(0,0,0,0.24)]">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-white">Select a conversation</p>
          <p className="text-sm text-gray-500">Choose a thread to read messages and reply.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[72vh] flex-1 flex-col overflow-hidden rounded-2xl border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_16px_40px_rgba(0,0,0,0.24)] backdrop-blur-sm lg:min-h-[62vh]">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/6 bg-[rgba(8,8,8,0.84)] px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBackMobile && (
            <button
              type="button"
              onClick={onBackMobile}
              className="inline-flex items-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-gray-300 lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          <div>
            <h2 className="text-sm font-semibold text-white">{conversation.username}</h2>
            <OnlineStatusBadge online={conversation.online} lastSeenLabel={conversation.lastSeenLabel} />
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-1 overflow-y-auto px-3.5 py-4 scrollbar-tactical sm:px-4">
        {hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="mx-auto mb-3 block rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-gray-300 disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load older messages'}
          </button>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-11 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-[220px] items-center justify-center text-center">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-white">No messages yet</p>
              <p className="text-sm text-gray-500">Say hello and start the conversation.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const previous = messages[index - 1];
            const grouped = Boolean(previous && previous.isMe === message.isMe);
            return <MessageBubble key={message.id} message={message} isMe={message.isMe} grouped={grouped} />;
          })
        )}
      </div>

      <MessageComposer
        value={draft}
        onChange={onDraftChange}
        onSend={onSend}
        disabled={!draft.trim() && !attachmentLabel}
        onAttachFile={onAttachFile}
        attachmentLabel={attachmentLabel}
      />
    </section>
  );
};

export default ThreadView;
