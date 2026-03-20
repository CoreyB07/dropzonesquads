import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMySquads } from '../context/MySquadsContext';
import { trackUxEvent } from '../utils/uxTelemetry';
import SquadCard from '../components/SquadCard';
import ApplyModal from '../components/ApplyModal';
import SkeletonCard from '../components/SkeletonCard';
import FilterDrawer, { DEFAULT_FILTERS, applyFilters, countActiveFilters } from '../components/FilterDrawer';
import { Crown, ShieldCheck, Mail, ArrowRight, KeyRound, Info, CheckSquare, Compass } from 'lucide-react';
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

const PREMIUM_PERKS = [
    'Supporter badge on your profile',
    'Optional highlighted squad-card style',
    'Early access to new visual themes',
    'Direct feedback and support channel'
];

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

            {/* Community Support & Free Features */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Why Free Card */}
                <article className="card-tactical xl:col-span-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-200">Why Drop Zone Squads Is Free</h2>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Drop Zone Squads is free for all users. Browse squads, create your profile, post squads, send join requests, and connect with players without paying. The goal is to keep squad finding open, active, and easy for everyone.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Free For All Users</p>
                            <p className="mt-1 text-sm font-bold text-white">Full access to core features</p>
                        </div>
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No Paywalls</p>
                            <p className="mt-1 text-sm font-bold text-white">Squad finding, posting, and messaging stay open</p>
                        </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-green-300">
                        Core features are free for everyone.
                    </p>
                </article>

                {/* Support Site Card */}
                <article className="card-tactical xl:col-span-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-tactical-yellow" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-100">Support The Site</h2>
                        </div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Drop Zone Squads is community-supported. Donations are optional and help cover hosting, development, and future improvements.
                    </p>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-200 flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-tactical-yellow shrink-0" />
                            <span>Helps keep the site online</span>
                        </p>
                        <p className="text-sm text-gray-200 flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-tactical-yellow shrink-0" />
                            <span>Supports development and new features</span>
                        </p>
                        <p className="text-sm text-gray-200 flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-tactical-yellow shrink-0" />
                            <span>Never required to use the platform</span>
                        </p>
                        <p className="text-sm text-gray-200 flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-tactical-yellow shrink-0" />
                            <span>No core features are locked</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs font-black uppercase tracking-wider">
                        <a
                            href={SUPPORT_CONFIG.cashAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-charcoal-dark border border-military-gray px-4 py-2 hover:border-tactical-yellow-hover transition-colors rounded text-gray-300 hover:text-white"
                        >
                            Support via Cash App
                        </a>
                        <a
                            href={SUPPORT_CONFIG.paypalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-charcoal-dark border border-military-gray px-4 py-2 hover:border-tactical-yellow-hover transition-colors rounded text-gray-300 hover:text-white"
                        >
                            Support via PayPal
                        </a>
                    </div>
                    <p className="text-[11px] text-gray-400">
                        Donations are optional and do not unlock required features.
                    </p>
                </article>

                {/* Activision ID Info */}
                <article className="card-tactical xl:col-span-12 space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-tactical-yellow" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-200">Activision ID: Optional Intel</h2>
                        </div>
                        <button
                            onClick={() => navigate('/privacy')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-military-gray bg-charcoal-dark text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white hover:border-gray-400 transition-all"
                        >
                            <Info className="w-3.5 h-3.5" /> Learn More
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-tactical-yellow">No ID Required</p>
                            <p className="mt-2 text-sm text-gray-300">Get in the game fast — sign up, add friends, join squads, and message without an Activision ID.</p>
                        </div>
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Add It Anytime</p>
                            <p className="mt-2 text-sm text-gray-300">Drop your Activision ID later from Profile when you want quicker squad coordination.</p>
                        </div>
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-tactical-yellow">You Control Sharing</p>
                            <p className="mt-2 text-sm text-gray-300">Flip profile privacy toggles anytime to control who can see your Activision ID.</p>
                        </div>
                    </div>
                </article>

                {/* Everything You Can Do Free */}
                <article className="card-tactical xl:col-span-12 space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-200">Everything You Can Do For Free</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-4 space-y-2">
                            <p className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Included for all users</p>
                            <p className="text-sm text-gray-300 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-gray-500" /> Browse squads</p>
                            <p className="text-sm text-gray-300 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-gray-500" /> Create an account</p>
                            <p className="text-sm text-gray-300 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-gray-500" /> Create a player profile</p>
                            <p className="text-sm text-gray-300 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-gray-500" /> Post squads</p>
                        </div>
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-4 space-y-2 md:mt-6">
                            <p className="text-sm text-gray-300 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-gray-500" /> Request to join squads</p>
                            <p className="text-sm text-gray-300 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-gray-500" /> Use direct messages</p>
                            <p className="text-sm text-gray-300 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-gray-500" /> Use squad chat</p>
                            <p className="text-sm text-gray-300 flex items-center gap-2"><ArrowRight className="w-3 h-3 text-gray-500" /> Join squads and unlock private squad comms</p>
                        </div>
                    </div>
                </article>

                {/* Contact Section */}
                <article className="card-tactical xl:col-span-12 space-y-4">
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-200">Contact Drop Zone Squads</h2>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Questions, support requests, bug reports, or suggestions? Send a message below.
                    </p>
                    <form className="space-y-4 max-w-2xl" onSubmit={(e) => { e.preventDefault(); alert("Feature coming soon! (Need backend endpoint)"); }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Name</label>
                                <input type="text" required placeholder="Your username or name" className="w-full bg-charcoal-dark border border-military-gray rounded p-2.5 text-sm text-white focus:border-tactical-yellow outline-none transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</label>
                                <input type="email" required placeholder="For replies" className="w-full bg-charcoal-dark border border-military-gray rounded p-2.5 text-sm text-white focus:border-tactical-yellow outline-none transition-colors" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Subject</label>
                            <input type="text" required placeholder="What is this regarding?" className="w-full bg-charcoal-dark border border-military-gray rounded p-2.5 text-sm text-white focus:border-tactical-yellow outline-none transition-colors" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Message</label>
                            <textarea required rows={4} placeholder="Type your message here..." className="w-full bg-charcoal-dark border border-military-gray rounded p-2.5 text-sm text-white focus:border-tactical-yellow outline-none transition-colors"></textarea>
                        </div>
                        <button type="submit" className="bg-tactical-yellow text-charcoal-dark hover:bg-tactical-yellow-hover text-xs font-black uppercase tracking-widest py-3 px-6 rounded transition-colors w-full md:w-auto">
                            Send Message
                        </button>
                    </form>
                </article>
            </section>

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
