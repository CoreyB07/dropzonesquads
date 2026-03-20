import React from 'react';

const MessageBubble = ({ message, isMe, grouped }) => {
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${grouped ? 'mt-1' : 'mt-3'}`}>
      {!grouped && (
        <span className="mb-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          {message.time}
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isMe
            ? `bg-tactical-yellow text-charcoal-dark font-bold ${grouped ? 'rounded-tr-md' : 'rounded-tr-sm'}`
            : `bg-charcoal-dark border border-military-gray text-gray-200 ${grouped ? 'rounded-tl-md' : 'rounded-tl-sm'}`
        }`}
      >
        {message.body}
      </div>
    </div>
  );
};

export default MessageBubble;
