import React from 'react';

const OnlineStatusBadge = ({ online, lastSeenLabel = 'Offline' }) => {
  return (
    <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
      <span
        className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-gray-500'}`}
        aria-hidden="true"
      />
      <span className={online ? 'text-emerald-300' : 'text-gray-500'}>
        {online ? 'Online' : lastSeenLabel}
      </span>
    </div>
  );
};

export default OnlineStatusBadge;
