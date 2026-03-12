import React from 'react';
import { Shield, ShieldHalf, Megaphone, Swords, Award, Backpack, Skull, Mic, Clock3, HeartPulse, AlertTriangle, Hourglass, Moon } from 'lucide-react';

const categoryStyles = {
  serious: 'border-blue-500/35 text-blue-300 bg-blue-500/10',
  funny: 'border-purple-500/35 text-purple-300 bg-purple-500/10',
  status: 'border-amber-500/40 text-amber-300 bg-amber-500/10'
};

const iconMap = {
  shield: Shield,
  'shield-half': ShieldHalf,
  megaphone: Megaphone,
  swords: Swords,
  award: Award,
  backpack: Backpack,
  skull: Skull,
  mic: Mic,
  clock: Clock3,
  'heart-pulse': HeartPulse,
  'alert-triangle': AlertTriangle,
  hourglass: Hourglass,
  moon: Moon
};

const BadgeChip = ({ label, category = 'serious', icon = '', description = '', compact = false }) => {
  if (!label) return null;
  const Icon = iconMap[icon] || null;

  return (
    <span
      title={description || label}
      className={`inline-flex items-center gap-1 rounded-full border font-black uppercase tracking-widest ${categoryStyles[category] || categoryStyles.serious} ${compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'}`}
    >
      {Icon && <Icon className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
      {label}
    </span>
  );
};

export default BadgeChip;
