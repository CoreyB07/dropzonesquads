import React from 'react';

const categoryStyles = {
  serious: 'border-blue-500/35 text-blue-300 bg-blue-500/10',
  funny: 'border-purple-500/35 text-purple-300 bg-purple-500/10',
  status: 'border-amber-500/40 text-amber-300 bg-amber-500/10'
};

const BadgeChip = ({ label, category = 'serious', compact = false }) => {
  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-black uppercase tracking-widest ${categoryStyles[category] || categoryStyles.serious} ${compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'}`}
    >
      {label}
    </span>
  );
};

export default BadgeChip;
