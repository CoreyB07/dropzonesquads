import React from 'react';

const MessageBubble = ({ message, isMe }) => {
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
        isMe
          ? 'bg-tactical-yellow text-charcoal-dark font-bold rounded-tr-sm'
          : 'bg-charcoal-dark border border-military-gray text-gray-200 rounded-tl-sm'
      }`}>
        {message.body}
      </div>
      <span className="mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">{message.time}</span>
    </div>
  );
};

export default MessageBubble;
