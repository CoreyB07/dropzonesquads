export const PRESET_PROFILE_PICTURES = [
  { id: 'nature-tree', label: 'Tree', category: 'nature', src: '/profile-pictures/presets/nature/tree.svg' },
  { id: 'nature-raven', label: 'Raven', category: 'nature', src: '/profile-pictures/presets/nature/raven.svg' },
  { id: 'nature-wolf', label: 'Wolf', category: 'nature', src: '/profile-pictures/presets/nature/wolf.svg' },
  { id: 'operators-sword', label: 'Sword Operator', category: 'operators', src: '/profile-pictures/presets/operators/sword-operator.svg' },
  { id: 'gear-helmet', label: 'Tactical Helmet', category: 'gear', src: '/profile-pictures/presets/gear/tactical-helmet.svg' },
  { id: 'gear-mask', label: 'Mask', category: 'gear', src: '/profile-pictures/presets/gear/mask.svg' },
  { id: 'emblems-skull', label: 'Skull', category: 'emblems', src: '/profile-pictures/presets/emblems/skull.svg' },
  { id: 'emblems-grenade', label: 'Grenade', category: 'emblems', src: '/profile-pictures/presets/emblems/grenade.svg' },
  { id: 'abstract-echo', label: 'Echo Wave', category: 'abstract', src: '/profile-pictures/presets/abstract/echo-wave.svg' },
  { id: 'rank-vanguard', label: 'Vanguard Rank', category: 'rank', src: '/profile-pictures/presets/rank/vanguard-rank.svg' }
];

export const PRESET_PROFILE_PICTURE_MAP = PRESET_PROFILE_PICTURES.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});
