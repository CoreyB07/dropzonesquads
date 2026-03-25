import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMySquads } from '../context/MySquadsContext';
import { trackUxEvent } from '../utils/uxTelemetry';
import SquadCard from '../components/SquadCard';
import ApplyModal from '../components/ApplyModal';
import SkeletonCard from '../components/SkeletonCard';
import FilterDrawer, { DEFAULT_FILTERS, applyFilters, countActiveFilters } from '../components/FilterDrawer';
import { ShieldCheck, CheckSquare } from 'lucide-react';
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
    email: 'coreybuchanan79@gmail.com',
    bugReportEmail: 'coreybuchanan79@gmail.com'
};

const STANDOUT_HEADING_CLASS = 'text-xl sm:text-2xl font-black tracking-tight text-gray-100';
const SECTION_SHELL_CLASS = 'relative overflow-hidden rounded-[1.5rem] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-sm';
const SECTION_SHELL_SOFT_CLASS = 'relative overflow-hidden rounded-[1.35rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] shadow-[0_14px_38px_rgba(0,0,0,0.24)] backdrop-blur-sm';
const SECTION_INNER_GLOW = 'absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent';
const VALUE_PROPS = [
    'Find squads faster by mode, platform, and playstyle.',
    'Post your own squad and set the vibe you want.',
    'Keep core matchmaking free and open to everyone.',
    'Join active squads and coordinate without the noise.'
];

const DEMO_SQUADS = [
    {
        id: 'demo-1',
        name: 'Late Night Resurgence',
        gameMode: 'Resurgence',
        platform: 'Crossplay',
        micRequired: true,
        skillLevel: 'Chill but Competitive',
        audience: 'Open to All',
        comms: 'Discord',
        playerCount: 3,
        maxPlayers: 4,
        acceptingPlayers: true,
        listingType: 'squad_looking_for_players',
        createdAt: '2026-03-25T16:00:00Z'
    },
    {
        id: 'demo-2',
        name: 'Ranked Push Crew',
        gameMode: 'Ranked',
        platform: 'PC',
        micRequired: true,
        skillLevel: 'Sweaty',
        audience: 'Invite Only',
        comms: 'Game Chat',
        playerCount: 2,
        maxPlayers: 4,
        acceptingPlayers: true,
        listingType: 'squad_looking_for_players',
        createdAt: '2026-03-25T15:20:00Z'
    },
    {
        id: 'demo-3',
        name: 'Weekend Big Map Squad',
        gameMode: 'Battle Royale',
        platform: 'PlayStation',
        micRequired: false,
        skillLevel: 'Casual',
        audience: 'Open to All',
        comms: 'Game Chat',
        playerCount: 2,
        maxPlayers: 4,
        acceptingPlayers: true,
        listingType: 'squad_looking_for_players',
        createdAt: '2026-03-25T14:10:00Z'
    },
    {
        id: 'demo-4',
        name: 'Squad Fill for Trios',
        gameMode: 'Battle Royale',
        platform: 'Crossplay',
        micRequired: true,
        skillLevel: 'Intermediate',
        audience: 'Open to All',
        comms: 'Discord',
        playerCount: 2,
        maxPlayers: 3,
        acceptingPlayers: true,
        listingType: 'squad_looking_for_players',
        createdAt: '2026-03-25T13:35:00Z'
    },
    {
        id: 'demo-5',
        name: 'Rebirth After Work',
        gameMode: 'Resurgence',
        platform: 'Xbox',
        micRequired: false,
        skillLevel: 'Casual',
        audience: 'Open to All',
        comms: 'Game Chat',
        playerCount: 3,
        maxPlayers: 4,
        acceptingPlayers: true,
        listingType: 'squad_looking_for_players',
        createdAt: '2026-03-25T12:50:00Z'
    },
    {
        id: 'demo-6',
        name: 'Strategic Snipers',
        gameMode: 'Battle Royale',
        platform: 'PC',
        micRequired: true,
        skillLevel: 'Competitive',
        audience: 'Invite Only',
        comms: 'Discord',
        playerCount: 2,
        maxPlayers: 4,
        acceptingPlayers: true,
        listingType: 'squad_looking_for_players',
        createdAt: '2026-03-25T12:05:00Z'
    },
    {
        id: 'demo-7',
        name: 'Solo Looking for Squad',
        gameMode: 'Plunder',
        platform: 'Xbox',
        micRequired: false,
        skillLevel: 'Beginner Friendly',
        audience: 'Open to All',
        comms: 'Discord',
        playerCount: 1,
        maxPlayers: 99,
        acceptingPlayers: true,
        listingType: 'player_looking_for_squad',
        createdAt: '2026-03-25T11:20:00Z'
    },
    {
        id: 'demo-8',
        name: 'Night Owl Ranked Duo',
        gameMode: 'Ranked',
        platform: 'PlayStation',
        micRequired: true,
        skillLevel: 'Sweaty',
        audience: 'Open to All',
        comms: 'Game Chat',
        playerCount: 1,
        maxPlayers: 2,
        acceptingPlayers: true,
        listingType: 'squad_looking_for_players',
        createdAt: '2026-03-25T10:40:00Z'
    },
    {
        id: 'demo-9',
        name: 'Casual Crossplay Crew',
        gameMode: 'Resurgence',
        platform: 'Crossplay',
        micRequired: false,
        skillLevel: 'Casual',
        audience: 'Open to All',
        comms: 'Discord',
        playerCount: 2,
        maxPlayers: 4,
        acceptingPlayers: true,
        listingType: 'squad_looking_for_players',
        createdAt: '2026-03-25T09:10:00Z'
    }
];

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

    const hasLiveSquads = squads.length > 0;
    const displaySquads = hasLiveSquads ? squads : DEMO_SQUADS;

    const filteredSquads = React.useMemo(
        () => applyFilters(displaySquads, filters),
        [displaySquads, filters]
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
    const openSquadCount = prioritized.featured.length + prioritized.remainingOpen.length;
    const heroStats = [
        { value: loading ? '...' : String(openSquadCount), label: 'Open squads' },
        { value: loading ? '...' : String(prioritized.featured.length), label: 'Featured picks' },
        { value: activeCount > 0 ? String(activeCount) : '0', label: 'Active filters' }
    ];


    return (
        <div className="relative space-y-6 sm:space-y-12">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-[70%] rounded-full bg-tactical-yellow/10 blur-3xl sm:h-96 sm:w-96" />
                <div className="absolute -left-20 top-[30%] h-52 w-52 rounded-full bg-white/[0.04] blur-3xl sm:h-72 sm:w-72" />
                <div className="absolute -right-16 top-[55%] h-56 w-56 rounded-full bg-premium-gold/10 blur-3xl sm:h-80 sm:w-80" />
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>

            {/* Hero Section */}
            <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/8 min-h-[360px] shadow-[0_28px_70px_rgba(0,0,0,0.38)] sm:min-h-[560px]">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{
                        backgroundImage: 'url("/warzoneheropic.png")'
                    }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/55 via-black/18 to-black/8" />
                <div className="absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                <div className="relative z-10 flex min-h-[360px] items-center px-4 py-7 sm:min-h-[560px] sm:px-6 sm:py-14">
                    <div className="mx-auto w-full max-w-4xl text-center">
                        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-3 sm:space-y-5">
                            <span className="inline-flex items-center gap-2 rounded-full border border-premium-gold/25 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-premium-gold-soft backdrop-blur-sm sm:px-4 sm:text-xs">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Free Core Matchmaking
                            </span>
                            <h1 className="max-w-3xl text-[2.2rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white drop-shadow-2xl sm:text-5xl md:text-7xl">
                                Find Your <span className="text-premium-glow inline-block" data-text="Warzone">Warzone</span> Squad
                            </h1>
                            <p className="max-w-xl text-[13px] font-medium leading-5 text-gray-300 sm:max-w-2xl sm:text-lg sm:leading-8 md:text-2xl">
                                Stop dropping with randoms. Find Warzone teammates that match your mode, vibe, and playstyle.
                            </p>

                            <div className="flex w-full max-w-xl flex-col gap-2 pt-1 sm:flex-row sm:justify-center sm:gap-3 sm:pt-2">
                                <button
                                    onClick={() => navigate('/find')}
                                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-tactical-yellow px-6 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-charcoal-dark transition-colors hover:bg-tactical-yellow-hover sm:w-auto sm:px-8"
                                >
                                    Find a Squad
                                </button>
                                <button
                                    onClick={() => navigate('/post')}
                                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-tactical-yellow/35 bg-tactical-yellow/10 px-6 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-tactical-yellow transition-all hover:border-tactical-yellow-hover hover:bg-tactical-yellow/20 sm:w-auto sm:px-8"
                                >
                                    Post a Squad
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate('/find')}
                                className="text-xs font-bold uppercase tracking-[0.16em] text-gray-300 underline underline-offset-4 transition-colors hover:text-white sm:text-sm"
                            >
                                How it works
                            </button>
                        </div>

                        <div className="mx-auto mt-5 hidden max-w-3xl grid-cols-1 gap-2.5 sm:mt-8 sm:grid sm:grid-cols-3 sm:gap-3">
                            {heroStats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md"
                                >
                                    <p className="text-xl font-black text-white sm:text-2xl">{stat.value}</p>
                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 sm:text-[11px]">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {!checklistDismissed && !checklistCompleted && (
                <section className={`${SECTION_SHELL_SOFT_CLASS} p-4 sm:p-5`}>
                    <div className={SECTION_INNER_GLOW} />
                    <div className="relative space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tactical-yellow">Quick start</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <CheckSquare className="h-4 w-4 text-tactical-yellow" />
                                    <h2 className="text-sm font-bold text-white">Get set up fast</h2>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400">{firstRunTasks.filter(t => t.done).length}/{firstRunTasks.length} complete</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                            {firstRunTasks.map((task) => (
                                <button
                                    key={task.id}
                                    type="button"
                                    onClick={task.action}
                                    className="rounded-xl border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-3.5 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-white/12"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className={`text-sm font-semibold ${task.done ? 'text-green-300' : 'text-white'}`}>{task.label}</p>
                                            <p className="mt-1 text-[11px] text-gray-500">{task.done ? 'Complete' : task.cta}</p>
                                        </div>
                                        <span className={`mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${task.done ? 'bg-green-400' : 'bg-tactical-yellow'}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.setItem('dzs_checklist_dismissed', 'true');
                                    setChecklistDismissed(true);
                                    trackUxEvent('checklist_dismissed');
                                }}
                                className="text-xs text-gray-500 transition-colors hover:text-white"
                            >
                                Dismiss quick start
                            </button>
                        </div>
                    </div>
                </section>
            )}

            <section className={`${SECTION_SHELL_SOFT_CLASS} p-4 sm:p-5`}>
                <div className={SECTION_INNER_GLOW} />
                <div className="relative space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tactical-yellow">Discover</p>
                            <h2 className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-white">Filters</h2>
                            <p className="mt-1 text-xs text-gray-500">Dial in platform, mode, and squad vibe before you browse.</p>
                        </div>
                        <FilterDrawer filters={filters} onChange={setFilters} />
                    </div>
                    {activeCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            {Object.entries(filters).flatMap(([key, values]) =>
                                values.map(v => (
                                    <span
                                        key={`${key}-${v}`}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/25 px-3 py-1 text-xs font-semibold text-gray-300"
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
                                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {loading ? (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className={STANDOUT_HEADING_CLASS}>All Squads</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array(9).fill(0).map((_, i) => <SkeletonCard key={`ads-skeleton-${i}`} />)}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="space-y-8">
                    <section className="relative pt-1">
                        <div className="relative space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tactical-yellow">Browse</p>
                                    <h2 className={`${STANDOUT_HEADING_CLASS} mt-2`}>All Squads</h2>
                                    <p className="mt-1 text-sm text-gray-500">Browse active squads and find a team that matches your style.</p>
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{filteredSquads.length} results</p>
                            </div>
                            {filteredSquads.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                                    {visibleClanAds.map((squad) => (
                                        <SquadCard
                                            key={squad.id}
                                            squad={squad}
                                            onJoin={(picked) => setSelectedSquad(picked)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="col-span-full rounded-3xl border border-dashed border-military-gray bg-black/20 py-10 text-center font-bold uppercase tracking-widest text-gray-500">
                                    No squads match current filters
                                </div>
                            )}
                            {hasMoreAds && (
                                <div className="pt-2 text-center sm:pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowMoreAds((prev) => !prev)}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition-all hover:border-tactical-yellow-hover hover:text-tactical-yellow-hover sm:px-8 sm:text-sm"
                                    >
                                        {showMoreAds ? 'Show Less' : 'See More Squads'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            <section className={`${SECTION_SHELL_SOFT_CLASS} p-4 sm:p-5`}>
                <div className={SECTION_INNER_GLOW} />
                <div className="relative space-y-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tactical-yellow">Why it works</p>
                        <div className="mt-2 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-tactical-yellow" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-200">Why players use Drop Zone Squads</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {VALUE_PROPS.map((valueProp, index) => (
                            <div
                                key={valueProp}
                                className="rounded-xl border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-4 py-3 text-sm leading-6 text-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                            >
                                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-tactical-yellow/80">0{index + 1}</p>
                                {valueProp}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-military-gray/60 pt-2 pb-6 text-xs text-gray-400">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-2xl leading-5">
                        Drop Zone Squads is free to use. Optional donations help cover hosting and development.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <a href={SUPPORT_CONFIG.paypalUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-military-gray px-3 py-1.5 hover:text-white transition-colors">Support the Site</a>
                        <a href={SUPPORT_CONFIG.cashAppUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-military-gray px-3 py-1.5 hover:text-white transition-colors">Donate</a>
                        <a href={`mailto:${SUPPORT_CONFIG.email}`} className="inline-flex rounded-full border border-military-gray px-3 py-1.5 hover:text-white transition-colors">Contact</a>
                        <a href={`mailto:${SUPPORT_CONFIG.bugReportEmail}?subject=Drop%20Zone%20Squads%20Bug%20Report`} className="inline-flex rounded-full border border-military-gray px-3 py-1.5 hover:text-white transition-colors">Report Bug</a>
                        <button onClick={() => navigate('/privacy')} className="inline-flex rounded-full border border-military-gray px-3 py-1.5 hover:text-white transition-colors">Privacy</button>
                    </div>
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
