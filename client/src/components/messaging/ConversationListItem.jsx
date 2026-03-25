import React from 'react';
import OnlineStatusBadge from './OnlineStatusBadge';

const ConversationListItem = ({ conversation, active, onClick, onKeyDown }) => {
  const initial = (conversation.username || '?').charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onClick(conversation.id)}
      onKeyDown={(event) => onKeyDown?.(event, conversation.id)}
      className={`w-full border-b border-white/6 px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tactical-yellow/80 ${
        active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
      }`}
      aria-pressed={active}
      aria-label={`Open conversation with ${conversation.username}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/7 bg-white/[0.03] text-sm font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-white">{conversation.username}</p>
            <span className="text-[10px] font-medium text-gray-500">{conversation.time}</span>
          </div>
          <p className="mt-0.5 truncate text-sm text-gray-400">{conversation.preview}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <OnlineStatusBadge online={conversation.online} lastSeenLabel={conversation.lastSeenLabel} />
            {conversation.unreadCount > 0 && (
              <span className="inline-flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-tactical-yellow px-1 text-[9px] font-bold leading-none text-charcoal-dark">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ConversationListItem;
