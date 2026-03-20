import React from 'react';
import OnlineStatusBadge from './OnlineStatusBadge';

const ConversationListItem = ({ conversation, active, onClick }) => {
  const initial = (conversation.username || '?').charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onClick(conversation.id)}
      className={`w-full text-left px-3 py-3 border-b border-military-gray/40 transition-colors ${
        active ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl border border-military-gray bg-charcoal-dark flex items-center justify-center text-sm font-black text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-black uppercase tracking-wider text-white">{conversation.username}</p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{conversation.time}</span>
          </div>
          <p className="truncate text-sm text-gray-400 mt-0.5">{conversation.preview}</p>
          <div className="mt-1.5 flex items-center justify-between">
            <OnlineStatusBadge online={conversation.online} lastSeenLabel={conversation.lastSeenLabel} />
            {conversation.unreadCount > 0 && (
              <span className="inline-flex min-w-[1.1rem] h-[1.1rem] px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black leading-none">
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
