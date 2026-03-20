import React from 'react';
import ConversationListItem from './ConversationListItem';

const ConversationList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  loading,
  error,
  compact = false
}) => {
  return (
    <aside className="w-full lg:w-[340px] xl:w-[380px] border border-military-gray rounded-xl overflow-hidden bg-charcoal-light">
      <div className="px-3 py-3 border-b border-military-gray bg-charcoal-dark">
        <h2 className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Messages</h2>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Direct messaging</p>
      </div>

      <div className={`${compact ? 'max-h-[72vh]' : 'max-h-[62vh]'} overflow-y-auto scrollbar-tactical`}>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-14 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-300 font-bold uppercase tracking-widest">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 font-bold uppercase tracking-widest">No conversations yet</div>
        ) : (
          conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === activeConversationId}
              onClick={onSelectConversation}
            />
          ))
        )}
      </div>
    </aside>
  );
};

export default ConversationList;
