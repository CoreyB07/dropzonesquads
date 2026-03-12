import React, { useState, useEffect } from 'react';
import SquadCard from '../components/SquadCard';
import ApplyModal from '../components/ApplyModal';
import SkeletonCard from '../components/SkeletonCard';
import FilterDrawer, { DEFAULT_FILTERS, applyFilters, countActiveFilters } from '../components/FilterDrawer';
import { fetchSquads as fetchSquadsFromDb } from '../utils/squadsApi';

const isSquadOpen = (squad) => {
    const current = Number(squad?.playerCount || 0);
    const limit = Number(squad?.maxPlayers || 0);
    return squad?.acceptingPlayers !== false && current < limit;
};

const getEngagementScore = (squad) => {
    const current = Number(squad?.playerCount || 0);
    const limit = Number(squad?.maxPlayers || 0);
    const ratio = limit > 0 ? current / limit : 0;
    return ratio * 100 + current;
};

const FindSquad = () => {
    const [squads, setSquads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSquad, setSelectedSquad] = useState(null);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    useEffect(() => {
        const loadSquads = async () => {
            try {
                const data = await fetchSquadsFromDb();
                setSquads(data || []);
            } catch (error) {
                console.error('Error fetching squads:', error);
                setSquads([]);
            } finally {
                setLoading(false);
            }
        };
        loadSquads();
    }, []);

    const filteredSquads = React.useMemo(
        () => applyFilters(squads, filters),
        [squads, filters]
    );

    const { featured, rest } = React.useMemo(() => {
        const open = [...filteredSquads.filter(isSquadOpen)]
            .sort((a, b) => getEngagementScore(b) - getEngagementScore(a));
        const closed = [...filteredSquads.filter(s => !isSquadOpen(s))]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const featuredSet = open.slice(0, 4);
        const featuredIds = new Set(featuredSet.map(s => String(s.id)));
        const remaining = [
            ...open.filter(s => !featuredIds.has(String(s.id))),
            ...closed
        ];
        return { featured: featuredSet, rest: remaining };
    }, [filteredSquads]);

    const activeCount = countActiveFilters(filters);
    const LABEL = 'text-xs font-black uppercase tracking-widest text-gray-500 mb-3';

    return (
        <div className="space-y-8 pb-20">
            {/* Header + Filter Button */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Find a Squad</h1>
                    <p className="text-gray-400 uppercase text-xs font-bold tracking-widest mt-1">
                        Active listings — updated in real time
                    </p>
                </div>
                <FilterDrawer filters={filters} onChange={setFilters} />
            </div>

            {/* Active filter chips (summary row) */}
            {activeCount > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(filters).flatMap(([key, values]) =>
                        values.map(v => (
                            <span
                                key={`${key}-${v}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tactical-yellow/10 border border-tactical-yellow/40 text-tactical-yellow text-xs font-black uppercase tracking-wider"
                            >
                                {v}
                                <button
                                    onClick={() => setFilters(f => ({
                                        ...f,
                                        [key]: f[key].filter(x => x !== v)
                                    }))}
                                    className="text-tactical-yellow/60 hover:text-tactical-yellow-hover leading-none"
                                >
                                    ×
                                </button>
                            </span>
                        ))
                    )}
                    <button
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                        className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-red-400 transition-colors"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="space-y-8">
                    <section>
                        <p className={LABEL}>Featured Squads</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array(4).fill(0).map((_, i) => <SkeletonCard key={`f-${i}`} />)}
                        </div>
                    </section>
                    <section>
                        <p className={LABEL}>All Squads</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array(6).fill(0).map((_, i) => <SkeletonCard key={`a-${i}`} />)}
                        </div>
                    </section>
                </div>
            ) : filteredSquads.length === 0 ? (
                <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest bg-charcoal-light/50 rounded-3xl border border-dashed border-military-gray">
                    No squads found — try adjusting your filters
                </div>
            ) : (
                <div className="space-y-10">
                    {featured.length > 0 && (
                        <section>
                            <p className={LABEL}>Featured Squads</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {featured.map(squad => (
                                    <SquadCard key={squad.id} squad={squad} featured onJoin={setSelectedSquad} />
                                ))}
                            </div>
                        </section>
                    )}

                    {rest.length > 0 && (
                        <section>
                            <p className={LABEL}>All Squads</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rest.map(squad => (
                                    <SquadCard key={squad.id} squad={squad} onJoin={setSelectedSquad} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {selectedSquad && (
                <ApplyModal squad={selectedSquad} onClose={() => setSelectedSquad(null)} />
            )}
        </div>
    );
};

export default FindSquad;
