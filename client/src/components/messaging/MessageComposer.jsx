import React from 'react';
import { Paperclip, Send } from 'lucide-react';

const MessageComposer = ({ value, onChange, onSend, disabled, onAttachFile, attachmentLabel }) => {
  return (
    <form
      onSubmit={onSend}
      className="border-t border-military-gray bg-charcoal-dark px-3 py-3 flex flex-col gap-2"
    >
      {attachmentLabel && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Attachment: {attachmentLabel}</p>
      )}

      <div className="flex items-center gap-2">
        <label className="inline-flex items-center justify-center rounded-lg border border-military-gray bg-charcoal-light px-2.5 py-2.5 text-gray-300 cursor-pointer hover:border-tactical-yellow">
          <Paperclip className="h-4 w-4" />
          <input
            type="file"
            className="hidden"
            onChange={(event) => onAttachFile?.(event.target.files?.[0] || null)}
            accept=".jpg,.jpeg,.png,.webp,.pdf,.txt"
          />
        </label>

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
      </div>
    </form>
  );
};

export default MessageComposer;
