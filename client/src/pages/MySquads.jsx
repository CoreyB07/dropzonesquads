import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, UserRound, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMySquads } from '../context/MySquadsContext';
import SupporterBadge from '../components/SupporterBadge';
import SquadNameText from '../components/SquadNameText';

const SECTION_LABEL = 'text-xs font-black uppercase tracking-widest text-gray-500 mb-1';

const MySquads = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { mySquads, loading } = useMySquads();

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <section className="card-tactical space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                        <p className={SECTION_LABEL}>My Squads</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-3xl font-black uppercase tracking-tight text-white">
                                {user?.username || 'Member Access'}
                            </span>
                            {user?.isSupporter && <SupporterBadge />}
                        </div>
                        <p className="text-sm text-gray-400">
                            {user
                                ? 'Manage your joined squads, jump into chat, or open your inbox.'
                                : 'Browse freely, then create a free membership to track your squads and messaging access.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {user ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => navigate('/inbox')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-military-gray bg-charcoal-dark px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-200"
                                >
                                    <Mail className="h-4 w-4 text-tactical-yellow" />
                                    Inbox
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/profile')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-military-gray bg-charcoal-dark px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-200"
                                >
                                    <UserRound className="h-4 w-4 text-tactical-yellow" />
                                    Profile
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => navigate('/auth?mode=signup')}
                                className="inline-flex items-center gap-2 rounded-lg bg-tactical-yellow px-4 py-2 text-xs font-black uppercase tracking-widest text-charcoal-dark"
                            >
                                <Users className="h-4 w-4" />
                                Create Free Membership
                            </button>
                        )}
                    </div>
                </div>

                {!user ? (
                    <div className="rounded-xl border border-dashed border-military-gray bg-charcoal-dark/60 p-6 text-center space-y-3">
                        <p className="text-sm font-black uppercase tracking-widest text-gray-300">No membership loaded</p>
                        <p className="text-sm text-gray-500">Create a free membership to save your squads, send join requests, and message leaders.</p>
                    </div>
                ) : loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Array(4).fill(0).map((_, index) => (
                            <div key={`my-squad-skeleton-${index}`} className="rounded-xl border border-military-gray bg-charcoal-dark/70 p-4 space-y-3">
                                <div className="h-4 w-28 rounded bg-military-gray/60" />
                                <div className="h-3 w-40 rounded bg-military-gray/40" />
                                <div className="flex gap-2 pt-2">
                                    <div className="h-9 flex-1 rounded bg-military-gray/40" />
                                    <div className="h-9 flex-1 rounded bg-military-gray/40" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : mySquads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mySquads.map((squad) => (
                            <article key={squad.id} className="rounded-xl border border-military-gray bg-charcoal-dark/70 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                                            {squad.role === 'leader' || squad.role === 'co-leader' ? 'Squad Leadership' : 'Squad Member'}
                                        </p>
                                        <p className="text-lg font-black uppercase leading-tight text-white truncate">
                                            <SquadNameText name={squad.name} restClassName="text-white" />
                                        </p>
                                        <p className="text-[11px] uppercase tracking-widest text-gray-400">
                                            {squad.gameMode || 'Squad Listing'} / {squad.platform || 'Platform Unset'}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-tactical-yellow/30 bg-tactical-yellow/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-tactical-yellow">
                                        <Users className="h-3.5 w-3.5" />
                                        {squad.role || 'member'}
                                    </span>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/squad/${squad.id}`)}
                                        className="flex-1 rounded-lg border border-military-gray bg-charcoal-light px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white"
                                    >
                                        View Squad
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/squad/${squad.id}/chat`, { state: { from: location.pathname } })}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-tactical-yellow/40 bg-tactical-yellow/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-tactical-yellow"
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Open Chat
                                    </button>
                                    {(squad.role === 'leader' || squad.role === 'co-leader') && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/squad/${squad.id}/manage`)}
                                            className="rounded-lg border border-tactical-yellow/40 bg-tactical-yellow/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-tactical-yellow"
                                        >
                                            Manage
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-military-gray bg-charcoal-dark/60 p-6 text-center space-y-3">
                        <p className="text-sm font-black uppercase tracking-widest text-gray-300">No squads joined yet</p>
                        <p className="text-sm text-gray-500">Find a squad and join up. This page will track every squad you are part of.</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/find')}
                                className="inline-flex items-center gap-2 rounded-lg bg-tactical-yellow px-4 py-2 text-xs font-black uppercase tracking-widest text-charcoal-dark"
                            >
                                Find a Squad
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                className="inline-flex items-center gap-2 rounded-lg border border-military-gray bg-charcoal-dark px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-200"
                            >
                                <UserRound className="h-4 w-4 text-tactical-yellow" />
                                Open Profile
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default MySquads;
