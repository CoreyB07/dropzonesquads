import React from 'react';
import ConversationListItem from './ConversationListItem';

const ConversationList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  loading,
  error,
  compact = false,
  search,
  onSearchChange,
  showUnreadOnly,
  onToggleUnreadOnly,
  onItemKeyDown
}) => {
  return (
    <aside className="w-full overflow-hidden rounded-2xl border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_16px_40px_rgba(0,0,0,0.24)] backdrop-blur-sm lg:w-[340px] xl:w-[380px]">
      <div className="space-y-3 border-b border-white/6 bg-black/25 px-3.5 py-3.5">
        <div>
          <h2 className="text-sm font-bold text-white">Messages</h2>
          <p className="mt-1 text-[11px] text-gray-500">Search conversations and jump back in quickly.</p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search conversations"
          className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors focus:border-premium-gold-bright/40"
        />

        <label className="inline-flex items-center gap-2 text-[11px] font-medium text-gray-400">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(event) => onToggleUnreadOnly?.(event.target.checked)}
            className="accent-tactical-yellow"
          />
          Unread only
        </label>
      </div>

      <div
        className={`${compact ? 'max-h-[78vh]' : 'max-h-[62vh]'} overflow-y-auto scrollbar-tactical`}
        role="listbox"
        aria-label="Conversation list"
      >
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-5 text-sm text-red-300">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">No conversations match this filter. Try clearing search or unread-only.</div>
        ) : (
          conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === activeConversationId}
              onClick={onSelectConversation}
              onKeyDown={onItemKeyDown}
            />
          ))
        )}
      </div>
    </aside>
  );
};

export default ConversationList;
