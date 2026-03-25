import React from 'react';

const MessageBubble = ({ message, isMe, grouped }) => {
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${grouped ? 'mt-1' : 'mt-3.5'}`}>
      {!grouped && (
        <span className="mb-1.5 text-[10px] font-medium text-gray-500">
          {message.time}
        </span>
      )}
      <div
        className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
          isMe
            ? `bg-tactical-yellow text-charcoal-dark ${grouped ? 'rounded-tr-md' : 'rounded-tr-sm'}`
            : `border border-white/7 bg-white/[0.03] text-gray-200 ${grouped ? 'rounded-tl-md' : 'rounded-tl-sm'}`
        }`}
      >
        {message.body}
      </div>
    </div>
  );
};

export default MessageBubble;
