import React from 'react';
import { Paperclip, Send } from 'lucide-react';

const MessageComposer = ({ value, onChange, onSend, disabled, onAttachFile, attachmentLabel }) => {
  return (
    <form
      onSubmit={onSend}
      className="flex flex-col gap-2 border-t border-white/6 bg-black/20 px-3.5 py-3"
    >
      {attachmentLabel && (
        <p className="text-[11px] text-gray-400">Attachment: {attachmentLabel}</p>
      )}

      <div className="flex items-center gap-2">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2.5 text-gray-300 transition-colors hover:border-premium-gold-bright/35">
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
          className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors focus:border-premium-gold-bright/40"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-xl bg-tactical-yellow px-3.5 py-2.5 text-xs font-semibold text-charcoal-dark transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-tactical-yellow-hover"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </div>
    </form>
  );
};

export default MessageComposer;
