import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMySquads } from '../context/MySquadsContext';
import { trackUxEvent } from '../utils/uxTelemetry';
import SquadCard from '../components/SquadCard';
import ApplyModal from '../components/ApplyModal';
import SkeletonCard from '../components/SkeletonCard';
import FilterDrawer, { DEFAULT_FILTERS, applyFilters, countActiveFilters } from '../components/FilterDrawer';
import { ShieldCheck, CheckSquare, Compass } from 'lucide-react';
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

const SUPPORT_CONFIG = {
    cashAppUrl: 'https://cash.app/$coreywayne79',
    paypalUrl: 'https://paypal.me/Buchanan117',
    email: 'coreybuchanan79@gmail.com'
};

const STANDOUT_HEADING_CLASS = 'text-xs font-black uppercase tracking-widest text-gray-500 mb-1';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { mySquads } = useMySquads();
    const [squads, setSquads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSquad, setSelectedSquad] = useState(null);
    const [showMoreAds, setShowMoreAds] = useState(false);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const activeCount = countActiveFilters(filters);

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

    const prioritized = React.useMemo(() => {
        const openSquads = [];
        const closedSquads = [];

        filteredSquads.forEach((squad) => {
            if (isSquadOpen(squad)) {
                openSquads.push(squad);
            } else {
                closedSquads.push(squad);
            }
        });

        const rankedOpen = [...openSquads].sort((a, b) => {
            const scoreDiff = getEngagementScore(b) - getEngagementScore(a);
            if (scoreDiff !== 0) return scoreDiff;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        const featured = rankedOpen.slice(0, 4);
        const featuredIds = new Set(featured.map((squad) => String(squad.id)));
        const remainingOpen = rankedOpen.filter((squad) => !featuredIds.has(String(squad.id)));
        const rankedClosed = [...closedSquads].sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        return { featured, remainingOpen, rankedClosed };
    }, [filteredSquads]);

    const allClanAds = React.useMemo(
        () => [...prioritized.remainingOpen, ...prioritized.rankedClosed],
        [prioritized.remainingOpen, prioritized.rankedClosed]
    );
    const showcaseSquads = React.useMemo(() => allClanAds.slice(0, 12), [allClanAds]);
    const visibleClanAds = showMoreAds ? allClanAds : showcaseSquads;
    const hasMoreAds = allClanAds.length > showcaseSquads.length;

    const [checklistDismissed, setChecklistDismissed] = useState(
        () => localStorage.getItem('dzs_checklist_dismissed') === 'true'
    );

    const firstRunTasks = [
        {
            id: 'profile',
            label: 'Complete your profile',
            done: Boolean(user?.username && user?.platform),
            action: () => {
                trackUxEvent('checklist_open_profile');
                navigate('/profile');
            },
            cta: 'Open Profile'
        },
        {
            id: 'find',
            label: 'Find a squad that matches you',
            done: false,
            action: () => {
                trackUxEvent('checklist_open_find');
                navigate('/find');
            },
            cta: 'Find Squad'
        },
        {
            id: 'post',
            label: 'Post your own squad listing',
            done: Boolean((mySquads || []).length > 0),
            action: () => {
                trackUxEvent('checklist_open_post');
                navigate('/post');
            },
            cta: 'Post Squad'
        }
    ];

    const checklistCompleted = firstRunTasks.every((task) => task.done);

    const nextAction = (mySquads || []).length === 0
        ? {
            title: 'Start with squad discovery',
            body: 'Browse active squads and send your first join request.',
            cta: 'Browse Squads',
            action: () => {
                trackUxEvent('next_action_browse_squads');
                navigate('/find');
            }
        }
        : {
            title: 'Manage your squad momentum',
            body: 'Review inbox and process any new join requests.',
            cta: 'Open Inbox',
            action: () => {
                trackUxEvent('next_action_open_inbox');
                navigate('/inbox');
            }
        };

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="relative h-[600px] flex items-center justify-center overflow-hidden rounded-3xl border border-military-gray">
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{
                        backgroundImage: 'url("/warzonehero.png")',
                        filter: 'brightness(0.4) grayscale(0.5)'
                    }}
                />
                <div className="relative z-10 text-center space-y-6 px-4">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-premium-gold/25 bg-black/40 backdrop-blur-sm text-[10px] md:text-xs font-black uppercase tracking-[0.22em] text-premium-gold-soft">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        100% Free Core Matchmaking
                    </span>
                    <div className="space-y-4 pt-2">
                        <h2 className="text-sm md:text-lg font-black uppercase tracking-[0.2em] text-white/90">
                            Why Drop With Randoms?
                        </h2>
                        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
                            Find Your <span className="text-premium-glow inline-block" data-text="Warzone">Warzone</span> Squad
                        </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-xl mx-auto font-medium">
                        Stop dropping with randoms. Build a Warzone squad that matches your playstyle.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button
                            onClick={() => navigate('/find')}
                            className="bg-tactical-yellow text-charcoal-dark font-black py-4 px-10 rounded-md hover:bg-tactical-yellow-hover transition-colors uppercase tracking-wider text-lg"
                        >
                            Find a Squad
                        </button>
                        <button
                            onClick={() => navigate('/post')}
                            className="bg-tactical-yellow/10 hover:bg-tactical-yellow/20 text-tactical-yellow font-black py-4 px-10 rounded-md transition-all backdrop-blur-md border border-tactical-yellow/35 hover:border-tactical-yellow-hover uppercase tracking-wider text-lg"
                        >
                            Post a Squad
                        </button>
                    </div>
                </div>

                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-transparent to-transparent z-5" />
            </section>

            {!checklistDismissed && !checklistCompleted && (
                <section className="card-tactical space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-tactical-yellow" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">First-Run Checklist</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.setItem('dzs_checklist_dismissed', 'true');
                                setChecklistDismissed(true);
                                trackUxEvent('checklist_dismissed');
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white"
                        >
                            Dismiss
                        </button>
                    </div>
                    <div className="space-y-2">
                        {firstRunTasks.map((task) => (
                            <div key={task.id} className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className={`text-sm font-bold ${task.done ? 'text-green-300' : 'text-white'}`}>{task.label}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500">{task.done ? 'Complete' : 'Recommended next step'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={task.action}
                                    className="btn-tactical text-[10px] py-2 px-3"
                                >
                                    {task.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="card-tactical space-y-3">
                <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-tactical-yellow" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">What to Do Next</h2>
                </div>
                <p className="text-sm text-gray-300">{nextAction.body}</p>
                <div>
                    <button type="button" onClick={nextAction.action} className="btn-tactical text-xs">
                        {nextAction.cta}
                    </button>
                </div>
            </section>

            {/* Filter Button + Active chips */}
            <div className="flex flex-wrap items-center gap-3">
                <FilterDrawer filters={filters} onChange={setFilters} />
                {activeCount > 0 && (
                    <>
                        {Object.entries(filters).flatMap(([key, values]) =>
                            values.map(v => (
                                <span
                                    key={`${key}-${v}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-dark border border-military-gray text-gray-300 text-xs font-black uppercase tracking-wider"
                                >
                                    {v}
                                    <button
                                        onClick={() => setFilters(f => ({
                                            ...f,
                                            [key]: f[key].filter(x => x !== v)
                                        }))}
                                        className="text-gray-500 hover:text-red-400 leading-none"
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
                    </>
                )}
            </div>

            {loading ? (
                <div className="space-y-8">
                    <section className="space-y-3">
                        <h2 className={STANDOUT_HEADING_CLASS}>Featured Squads</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array(4).fill(0).map((_, i) => <SkeletonCard key={`featured-skeleton-${i}`} />)}
                        </div>
                    </section>
                    <section className="space-y-3">
                        <h2 className={STANDOUT_HEADING_CLASS}>Squads</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array(12).fill(0).map((_, i) => <SkeletonCard key={`ads-skeleton-${i}`} />)}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="space-y-8">
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className={STANDOUT_HEADING_CLASS}>Featured Squads</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {prioritized.featured.length > 0 ? (
                                prioritized.featured.map((squad) => (
                                    <SquadCard
                                        key={squad.id}
                                        squad={squad}
                                        featured
                                        onJoin={(picked) => setSelectedSquad(picked)}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 text-gray-500 font-bold uppercase tracking-widest bg-charcoal-light/50 rounded-3xl border border-dashed border-military-gray">
                                    No open squads match current filters
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className={STANDOUT_HEADING_CLASS}>Squads</h2>
                        {visibleClanAds.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {visibleClanAds.map((squad) => (
                                    <SquadCard
                                        key={squad.id}
                                        squad={squad}
                                        onJoin={(picked) => setSelectedSquad(picked)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="col-span-full text-center py-10 text-gray-500 font-bold uppercase tracking-widest bg-charcoal-light/50 rounded-3xl border border-dashed border-military-gray">
                                No squads right now — check back soon
                            </div>
                        )}
                        {hasMoreAds && (
                            <div className="pt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => setShowMoreAds((prev) => !prev)}
                                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-military-gray bg-charcoal-light text-white text-sm font-black uppercase tracking-widest hover:border-tactical-yellow-hover hover:text-tactical-yellow-hover transition-all"
                                >
                                    {showMoreAds ? 'Show Less' : 'See More Squads'}
                                </button>
                            </div>
                        )}
                    </section>

                    {prioritized.featured.length === 0 &&
                        allClanAds.length === 0 && (
                            <div className="col-span-full text-center py-20 text-gray-500 font-bold uppercase tracking-widest bg-charcoal-light/50 rounded-3xl border border-dashed border-military-gray">
                                No ads found for current filters
                            </div>
                        )}
                </div>
            )}

            <section className="card-tactical space-y-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-tactical-yellow" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-200">Why players use Drop Zone Squads</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                    <p>• Find squads faster by mode, platform, and playstyle.</p>
                    <p>• Post your own squad and set the vibe you want.</p>
                    <p>• Keep core matchmaking free and open to everyone.</p>
                    <p>• Join active squads and coordinate without the noise.</p>
                </div>
            </section>

            <footer className="pt-2 pb-6 border-t border-military-gray/60 text-xs text-gray-400 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p>Drop Zone Squads is free to use. Optional donations help cover hosting and development.</p>
                <div className="flex flex-wrap items-center gap-3">
                    <a href={SUPPORT_CONFIG.paypalUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Support the Site</a>
                    <a href={SUPPORT_CONFIG.cashAppUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Donate</a>
                    <a href={`mailto:${SUPPORT_CONFIG.email}`} className="hover:text-white transition-colors">Contact</a>
                    <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy</button>
                </div>
            </footer>

            {
                selectedSquad && (
                    <ApplyModal
                        squad={selectedSquad}
                        onClose={() => setSelectedSquad(null)}
                    />
                )
            }
        </div >
    );
};

export default Home;
