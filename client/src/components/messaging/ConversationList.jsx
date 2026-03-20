import React from 'react';
import ConversationListItem from './ConversationListItem';

const ConversationList = ({ conversations, activeConversationId, onSelectConversation }) => {
  return (
    <aside className="w-full lg:w-[340px] xl:w-[380px] border border-military-gray rounded-xl overflow-hidden bg-charcoal-light">
      <div className="px-3 py-3 border-b border-military-gray bg-charcoal-dark">
        <h2 className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Messages</h2>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Direct messaging</p>
      </div>

      <div className="max-h-[62vh] overflow-y-auto scrollbar-tactical">
        {conversations.length === 0 ? (
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
