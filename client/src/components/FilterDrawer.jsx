import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, X, Search, Check } from 'lucide-react';
import { WARZONE_GAME_MODES } from '../constants/gameModes';

// ─── Filter Definitions ───────────────────────────────────────────────────────
export const FILTER_CATEGORIES = [
    {
        key: 'gameMode',
        label: 'Game Mode',
        options: WARZONE_GAME_MODES,
    },
    {
        key: 'platform',
        label: 'Platform',
        options: ['PlayStation', 'Xbox', 'Console', 'PC', 'Crossplay'],
    },
    {
        key: 'skillLevel',
        label: 'Skill Level',
        options: ['Casual', 'Competitive', 'Ranked'],
    },
    {
        key: 'audience',
        label: 'Audience',
        options: ['Open to All', 'Women Only', 'Men Only'],
    },
    {
        key: 'comms',
        label: 'Comms',
        options: ['Game', 'Discord'],
    },
];

// Default empty filter state
export const DEFAULT_FILTERS = {
    gameMode: [],
    platform: [],
    skillLevel: [],
    audience: [],
    comms: [],
};

// Count how many filters are active
export const countActiveFilters = (filters) =>
    Object.values(filters).reduce((acc, arr) => acc + arr.length, 0);

// Apply filters to a squad list
export const applyFilters = (squads, filters) => {
    return squads.filter((squad) => {
        if (filters.gameMode.length && !filters.gameMode.includes(squad.gameMode)) return false;
        if (filters.platform.length && !filters.platform.includes(squad.platform)) return false;
        if (filters.skillLevel.length && !filters.skillLevel.includes(squad.skillLevel)) return false;
        const audience = squad.audience || 'Open to All';
        if (filters.audience.length && !filters.audience.includes(audience)) return false;
        const comms = squad.comms || 'Game';
        if (filters.comms.length && !filters.comms.includes(comms)) return false;
        return true;
    });
};

// ─── Filter Drawer Component ──────────────────────────────────────────────────
const FilterDrawer = ({ filters, onChange }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const activeCount = countActiveFilters(filters);

    const toggle = (key, value) => {
        const current = filters[key] || [];
        const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        onChange({ ...filters, [key]: next });
    };

    const clearAll = () => {
        onChange({ ...DEFAULT_FILTERS });
    };

    const visibleCategories = useMemo(() => {
        if (!search.trim()) return FILTER_CATEGORIES;
        const q = search.toLowerCase();
        return FILTER_CATEGORIES.map((cat) => ({
            ...cat,
            options: cat.options.filter((o) => o.toLowerCase().includes(q)),
        })).filter((cat) => cat.options.length > 0 || cat.label.toLowerCase().includes(q));
    }, [search]);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-military-gray bg-charcoal-light px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:border-tactical-yellow-hover hover:text-tactical-yellow-hover sm:px-5 sm:text-sm"
            >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-tactical-yellow text-black text-[10px] font-black flex items-center justify-center">
                        {activeCount}
                    </span>
                )}
            </button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer — slides up from bottom */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 bg-[#111214] border-t border-military-gray rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'
                    }`}
                style={{ maxHeight: '85vh' }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1 rounded-full bg-military-gray" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between border-b border-military-gray px-4 py-4 sm:px-6">
                    <div>
                        <h2 className="text-base sm:text-lg font-black uppercase tracking-[0.18em] text-white">Filters</h2>
                        {activeCount > 0 && (
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                                {activeCount} active
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {activeCount > 0 && (
                            <button
                                onClick={clearAll}
                                className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-red-400"
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={() => setOpen(false)}
                            className="w-8 h-8 rounded-full bg-military-gray flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Search inside drawer */}
                <div className="border-b border-military-gray/50 px-4 py-3 sm:px-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search filters..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-tactical-yellow outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Filter Categories */}
                <div className="overflow-y-auto px-4 py-3 space-y-4 sm:px-5" style={{ maxHeight: 'calc(74vh - 170px)' }}>
                    {visibleCategories.map((cat) => (
                        <div key={cat.key}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                                {cat.label}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {cat.options.map((option) => {
                                    const selected = (filters[cat.key] || []).includes(option);
                                    return (
                                        <button
                                            key={option}
                                            onClick={() => toggle(cat.key, option)}
                                            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all sm:px-4 sm:text-sm ${selected
                                                ? 'bg-tactical-yellow text-black border-tactical-yellow'
                                                : 'bg-transparent text-gray-300 border-military-gray hover:border-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {selected && <Check className="w-3 h-3" />}
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {visibleCategories.length === 0 && (
                        <p className="text-center text-gray-500 font-bold uppercase tracking-widest py-8">
                            No filters match "{search}"
                        </p>
                    )}
                </div>

                {/* Apply button */}
                <div className="border-t border-military-gray px-4 py-4 sm:px-6">
                    <button
                        onClick={() => setOpen(false)}
                        className="w-full rounded-xl bg-tactical-yellow py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-tactical-yellow-hover"
                    >
                        Show Results{activeCount > 0 ? ` · ${activeCount} filter${activeCount > 1 ? 's' : ''} active` : ''}
                    </button>
                </div>
            </div>
        </>
    );
};

export default FilterDrawer;
