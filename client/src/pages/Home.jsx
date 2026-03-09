import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SquadCard from '../components/SquadCard';
import ApplyModal from '../components/ApplyModal';
import SkeletonCard from '../components/SkeletonCard';
import { Search, Crown, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
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

const STANDOUT_HEADING_CLASS = 'inline-flex items-center px-3 py-1 rounded-md bg-white text-black text-sm font-black uppercase tracking-widest';

const Home = () => {
    const navigate = useNavigate();
    const [squads, setSquads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSquad, setSelectedSquad] = useState(null);
    const [showMoreAds, setShowMoreAds] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        platform: 'Any Platform',
        mode: 'All Modes',
        group: 'Any Group',
        comms: 'Any Comms'
    });
    const filterSelectClass = 'w-full bg-charcoal-dark text-white border border-military-gray p-2 rounded text-sm outline-none focus:border-tactical-yellow focus:ring-1 focus:ring-tactical-yellow/40';

    useEffect(() => {
        const loadSquads = async () => {
            try {
                const data = await fetchSquadsFromDb();
                setSquads(data);
            } catch (error) {
                console.error('Error fetching squads:', error);
                setSquads([]);
            } finally {
                setLoading(false);
            }
        };

        loadSquads();
    }, []);

    const filteredSquads = React.useMemo(() => {
        return squads.filter((squad) => {
            const searchMatch = !searchTerm || squad.name.toLowerCase().includes(searchTerm.toLowerCase());
            const platformMatch =
                filters.platform === 'Any Platform' || squad.platform === filters.platform;

            const skillLevel = String(squad.skillLevel || '').toLowerCase();
            const modeMatch = (() => {
                if (filters.mode === 'All Modes') return true;
                if (filters.mode === 'Ranked') return skillLevel === 'ranked';
                if (filters.mode === 'Casual') return skillLevel === 'casual';
                return skillLevel === 'competitive';
            })();

            const audience = squad.audience || 'Open to All';
            const groupMatch = (() => {
                if (filters.group === 'Any Group') return true;
                if (filters.group === 'Men') return audience === 'Men Only';
                if (filters.group === 'Women') return audience === 'Women Only';
                if (filters.group === 'Open') return audience === 'Open to All';
                return true;
            })();

            const commsMatch =
                filters.comms === 'Any Comms' ||
                (filters.comms === 'Discord Only' && squad.comms === 'Discord');

            return searchMatch && platformMatch && modeMatch && groupMatch && commsMatch;
        });
    }, [squads, filters, searchTerm]);

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
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm text-[10px] md:text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        100% Free Core Matchmaking
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
                        Find Your <span className="text-tactical-yellow">Warzone</span> Squad
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-medium">
                        Find your Warzone squad. 100% free. Always.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button
                            onClick={() => navigate('/find')}
                            className="btn-tactical text-lg px-10 py-4"
                        >
                            Find a Squad
                        </button>
                        <button
                            onClick={() => navigate('/post')}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-10 rounded-md transition-all backdrop-blur-md border border-white/20 uppercase tracking-wider text-lg"
                        >
                            Post a Squad
                        </button>
                    </div>
                </div>

                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-transparent to-transparent z-5" />
            </section>
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search squads by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-charcoal-light border border-military-gray rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 text-sm focus:border-tactical-yellow focus:ring-1 focus:ring-tactical-yellow/30 outline-none transition-all"
                />
            </div>

            {/* Filters + All Ads */}
            <div className="space-y-6 pt-2" id="featured-squads">
                <section className="bg-charcoal-light p-4 rounded-xl border border-military-gray grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Platform</label>
                        <select
                            value={filters.platform}
                            onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                            className={filterSelectClass}
                        >
                            <option className="bg-charcoal-dark text-white">Any Platform</option>
                            <option className="bg-charcoal-dark text-white">PC</option>
                            <option className="bg-charcoal-dark text-white">PlayStation</option>
                            <option className="bg-charcoal-dark text-white">Xbox</option>
                            <option className="bg-charcoal-dark text-white">Crossplay</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Mode</label>
                        <select
                            value={filters.mode}
                            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                            className={filterSelectClass}
                        >
                            <option className="bg-charcoal-dark text-white">All Modes</option>
                            <option className="bg-charcoal-dark text-white">Regular</option>
                            <option className="bg-charcoal-dark text-white">Ranked</option>
                            <option className="bg-charcoal-dark text-white">Casual</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Group</label>
                        <select
                            value={filters.group}
                            onChange={(e) => setFilters({ ...filters, group: e.target.value })}
                            className={filterSelectClass}
                        >
                            <option className="bg-charcoal-dark text-white">Any Group</option>
                            <option className="bg-charcoal-dark text-white">Men</option>
                            <option className="bg-charcoal-dark text-white">Women</option>
                            <option className="bg-charcoal-dark text-white">Open</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Comms</label>
                        <select
                            value={filters.comms}
                            onChange={(e) => setFilters({ ...filters, comms: e.target.value })}
                            className={filterSelectClass}
                        >
                            <option className="bg-charcoal-dark text-white">Any Comms</option>
                            <option className="bg-charcoal-dark text-white">Discord Only</option>
                        </select>
                    </div>
                </section>

                {loading ? (
                    <div className="space-y-8">
                        <section className="space-y-3">
                            <h2 className={STANDOUT_HEADING_CLASS}>Featured Squads</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Array(4).fill(0).map((_, i) => <SkeletonCard key={`featured-skeleton-${i}`} />)}
                            </div>
                        </section>
                        <section className="space-y-3">
                            <h2 className={STANDOUT_HEADING_CLASS}>Clan Ads</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <h2 className={STANDOUT_HEADING_CLASS}>Clan Ads</h2>
                            {visibleClanAds.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    No additional clan ads right now
                                </div>
                            )}
                            {hasMoreAds && (
                                <div className="pt-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowMoreAds((prev) => !prev)}
                                        className={`${STANDOUT_HEADING_CLASS} border border-black hover:bg-gray-200 transition-colors`}
                                    >
                                        {showMoreAds ? 'Show Less' : 'More'}
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
            </div>

            {/* Free + Premium + Contact */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <article className="card-tactical xl:col-span-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-200">Why We Are Free</h2>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Core squad finding is free so the community stays large and active. Browse freely, then sign in with a free account when you are ready to join or post.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Free Tier Includes</p>
                            <p className="mt-1 text-sm font-bold text-white">Unlimited browsing for all visitors</p>
                        </div>
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Free Membership</p>
                            <p className="mt-1 text-sm font-bold text-white">Sign in with email + your chosen username to join or post squads</p>
                        </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-green-300">
                        All core features are free for everyone.
                    </p>
                </article>

                <article className="card-tactical xl:col-span-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-300" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-100">Optional Supporter Pass</h2>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-military-gray bg-charcoal-dark text-gray-300">
                            from $4.99 / year
                        </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Keep us 100% free. Support the site for a low yearly amount and get optional cosmetic perks.
                    </p>
                    <div className="space-y-2">
                        {PREMIUM_PERKS.map((perk) => (
                            <p key={perk} className="text-sm text-gray-200 flex items-start gap-2">
                                <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-amber-300 shrink-0" />
                                <span>{perk}</span>
                            </p>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs font-black uppercase tracking-wider">
                        <a
                            href={SUPPORT_CONFIG.cashAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-300 hover:text-amber-200 underline decoration-military-gray hover:decoration-amber-300 underline-offset-4 transition-colors"
                        >
                            Support via Cash App
                        </a>
                        <a
                            href={SUPPORT_CONFIG.paypalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-300 hover:text-amber-200 underline decoration-military-gray hover:decoration-amber-300 underline-offset-4 transition-colors"
                        >
                            Support via PayPal
                        </a>
                    </div>
                    <p className="text-[11px] text-gray-400">
                        Optional supporter status is manually activated after payment receipt.
                    </p>
                </article>

                <article className="card-tactical xl:col-span-12 space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-200">Free vs Premium</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-4 space-y-2">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-300">Free For Everyone</p>
                            <p className="text-sm text-gray-300">Unlimited browsing without an account</p>
                            <p className="text-sm text-gray-300">Standard squad cards</p>
                            <p className="text-sm text-gray-300">Free sign-in required for join requests and posting</p>
                        </div>
                        <div className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-4 space-y-2">
                            <p className="text-xs font-black uppercase tracking-widest text-amber-100">Supporter Perks (Optional)</p>
                            <p className="text-sm text-gray-100">Cosmetic highlight + supporter badge</p>
                            <p className="text-sm text-gray-100">Profile flair and theme previews</p>
                            <p className="text-sm text-gray-100">No core access is locked behind payment</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <a
                            href={`mailto:${SUPPORT_CONFIG.email}`}
                            className="rounded-lg border border-military-gray bg-charcoal-dark/70 p-4 hover:border-amber-300/40 transition-colors"
                        >
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" />
                                Contact Email
                            </p>
                            <p className="text-sm font-bold text-gray-200 mt-1">{SUPPORT_CONFIG.email}</p>
                        </a>
                    </div>
                </article>
            </section>

            {selectedSquad && (
                <ApplyModal
                    squad={selectedSquad}
                    onClose={() => setSelectedSquad(null)}
                />
            )}
        </div>
    );
};

export default Home;
