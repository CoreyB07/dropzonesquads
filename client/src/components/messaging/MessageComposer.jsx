import React from 'react';
import { Send } from 'lucide-react';

const MessageComposer = ({ value, onChange, onSend, disabled }) => {
  return (
    <form
      onSubmit={onSend}
      className="border-t border-military-gray bg-charcoal-dark px-3 py-3 flex items-center gap-2"
    >
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type a message..."
        className="flex-1 bg-charcoal-light border border-military-gray rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-tactical-yellow"
        maxLength={500}
      />
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-lg bg-tactical-yellow px-3 py-2.5 text-xs font-black uppercase tracking-widest text-charcoal-dark disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" /> Send
      </button>
    </form>
  );
};

export default MessageComposer;
