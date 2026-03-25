import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Shield, Users, Megaphone, Crown, RefreshCw, Check, X, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import {
    fetchAdminStats,
    fetchRecentSignups,
    fetchProfilePictureQueue,
    approveProfilePictureSubmission,
    rejectProfilePictureSubmission,
    fetchAdminSquads,
    deleteAdminSquad
} from '../utils/adminApi';

const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
};

const Admin = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const { error: showError, success } = useToast();
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalSquads: 0,
        totalSupporters: 0,
        totalSubscribers: 0
    });
    const [recentSignups, setRecentSignups] = useState([]);
    const [pictureQueue, setPictureQueue] = useState([]);
    const [adminSquads, setAdminSquads] = useState([]);
    const [moderationNote, setModerationNote] = useState('');
    const [squadSearch, setSquadSearch] = useState('');
    const [isFetching, setIsFetching] = useState(true);
    const [deletingSquadId, setDeletingSquadId] = useState(null);

    const canAccess = Boolean(user?.isAdmin);

    const loadAdminData = useCallback(async () => {
        if (!canAccess) {
            return;
        }

        setIsFetching(true);
        try {
            const [nextStats, nextSignups, nextPictureQueue, nextSquads] = await Promise.all([
                fetchAdminStats(),
                fetchRecentSignups(15),
                fetchProfilePictureQueue(60),
                fetchAdminSquads(150)
            ]);
            setStats(nextStats);
            setRecentSignups(nextSignups);
            setPictureQueue(nextPictureQueue);
            setAdminSquads(nextSquads);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            showError(error?.message || 'Unable to load admin dashboard data.');
        } finally {
            setIsFetching(false);
        }
    }, [canAccess, showError]);

    const handleApprovePicture = async (submissionId) => {
        try {
            await approveProfilePictureSubmission(submissionId, user.id);
            await loadAdminData();
            success('Profile picture approved.');
        } catch (error) {
            showError(error?.message || 'Could not approve profile picture.');
        }
    };

    const handleRejectPicture = async (submissionId) => {
        try {
            await rejectProfilePictureSubmission(submissionId, user.id, moderationNote);
            setModerationNote('');
            await loadAdminData();
            success('Profile picture rejected.');
        } catch (error) {
            showError(error?.message || 'Could not reject profile picture.');
        }
    };

    const handleDeleteSquad = async (squad) => {
        if (!squad?.id || deletingSquadId) return;

        const confirmed = window.confirm(`Delete squad listing "${squad.name}"? This cannot be undone.`);
        if (!confirmed) return;

        setDeletingSquadId(squad.id);
        try {
            await deleteAdminSquad(squad.id);
            success('Squad listing deleted.');
            window.location.reload();
            return;
        } catch (error) {
            console.error('Failed to delete squad:', error);
            showError(error?.message || 'Could not delete squad listing.');
        } finally {
            setDeletingSquadId(null);
        }
    };

    useEffect(() => {
        if (loading || !canAccess) {
            if (!loading) {
                setIsFetching(false);
            }
            return;
        }

        loadAdminData();
    }, [loading, canAccess, loadAdminData]);

    const filteredSquads = useMemo(() => {
        const query = squadSearch.trim().toLowerCase();
        if (!query) return adminSquads;

        return adminSquads.filter((squad) => {
            const haystack = [
                squad.name,
                squad.creator_username,
                squad.creator_email,
                squad.game_mode,
                squad.platform,
                squad.audience,
                squad.listing_type
            ].join(' ').toLowerCase();

            return haystack.includes(query);
        });
    }, [adminSquads, squadSearch]);

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto py-16">
                <div className="card-tactical text-center space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Loading Admin Dashboard...</h2>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-xl mx-auto py-16">
                <div className="card-tactical text-center space-y-4">
                    <Shield className="w-10 h-10 text-tactical-yellow mx-auto" />
                    <h2 className="text-2xl font-black uppercase tracking-tight">Sign In Required</h2>
                    <p className="text-gray-400 text-sm">Admin dashboard requires a signed-in account.</p>
                    <button onClick={() => navigate('/auth')} className="btn-tactical w-full">
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (!canAccess) {
        return (
            <div className="max-w-xl mx-auto py-16">
                <div className="card-tactical text-center space-y-4">
                    <Shield className="w-10 h-10 text-red-400 mx-auto" />
                    <h2 className="text-2xl font-black uppercase tracking-tight">Admin Access Only</h2>
                    <p className="text-gray-400 text-sm">
                        Your account is not marked as admin yet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">Admin Dashboard</h1>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-2">
                        Site metrics, moderation, and content controls
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadAdminData}
                    disabled={isFetching}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-md border border-military-gray text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white hover:border-gray-400 disabled:opacity-50"
                >
                    <span className="inline-flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </span>
                </button>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <article className="card-tactical space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Members</p>
                    <p className="text-3xl font-black text-white">{stats.totalMembers}</p>
                    <Users className="w-4 h-4 text-gray-500" />
                </article>
                <article className="card-tactical space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Squad Listings</p>
                    <p className="text-3xl font-black text-white">{stats.totalSquads}</p>
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                </article>
                <article className="card-tactical space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Supporters</p>
                    <p className="text-3xl font-black text-white">{stats.totalSupporters}</p>
                    <Crown className="w-4 h-4 text-gray-500" />
                </article>
                <article className="card-tactical space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Subscribers</p>
                    <p className="text-3xl font-black text-white">{stats.totalSubscribers}</p>
                    <Megaphone className="w-4 h-4 text-gray-500" />
                </article>
            </section>

            <section className="card-tactical space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-widest text-white">Squad Moderation</h2>
                        <p className="text-sm text-gray-500 mt-1">Review live squad posts and delete junk, demo, or spam listings.</p>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={squadSearch}
                            onChange={(e) => setSquadSearch(e.target.value)}
                            placeholder="Search squads, creator, mode..."
                            className="w-full rounded-lg border border-military-gray bg-charcoal-dark py-2.5 pl-9 pr-3 text-sm text-white"
                        />
                    </div>
                </div>

                {filteredSquads.length === 0 ? (
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">No squad listings match this search.</p>
                ) : (
                    <div className="space-y-3">
                        {filteredSquads.map((squad) => (
                            <div key={squad.id} className="rounded-xl border border-military-gray bg-charcoal-dark/60 p-3">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-black text-white uppercase tracking-wide">{squad.name || 'Unnamed Squad'}</p>
                                            <span className="inline-flex rounded-full border border-military-gray px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                {squad.platform || 'Unknown'}
                                            </span>
                                            <span className="inline-flex rounded-full border border-military-gray px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                {squad.game_mode || 'Unknown Mode'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Creator: <span className="text-gray-200 font-semibold">{squad.creator_username}</span>
                                            {squad.creator_email ? ` • ${squad.creator_email}` : ''}
                                        </p>
                                        <p className="text-[11px] text-gray-500 uppercase tracking-widest">
                                            {squad.audience || 'Open to All'} • {squad.listing_type || 'squad_looking_for_players'} • {formatDateTime(squad.created_at)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSquad(squad)}
                                        disabled={deletingSquadId === squad.id}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-red-500/40 px-3 py-2 text-xs font-black uppercase tracking-widest text-red-300 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {deletingSquadId === squad.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="card-tactical space-y-4">
                <h2 className="text-lg font-black uppercase tracking-widest text-white">Profile Picture Moderation Queue</h2>
                {pictureQueue.length === 0 ? (
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">No pending profile pictures.</p>
                ) : (
                    <div className="space-y-3">
                        {pictureQueue.map((item) => (
                            <div key={item.id} className="border border-military-gray rounded-xl p-3 bg-charcoal-dark/60">
                                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img src={item.previewUrl || ''} alt={item.username} className="w-14 h-14 rounded-lg object-cover border border-military-gray bg-charcoal-light" />
                                        <div>
                                            <p className="text-sm font-black text-white uppercase tracking-wide">{item.username}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Uploaded {formatDateTime(item.created_at)}</p>
                                            <p className="text-[10px] text-amber-300 uppercase tracking-widest font-black">{item.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleApprovePicture(item.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-green-500/40 text-green-300 text-xs font-black uppercase tracking-widest"
                                        >
                                            <Check className="w-3.5 h-3.5" /> Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRejectPicture(item.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-widest"
                                        >
                                            <X className="w-3.5 h-3.5" /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="pt-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Optional rejection reason</label>
                            <input
                                type="text"
                                value={moderationNote}
                                onChange={(e) => setModerationNote(e.target.value)}
                                placeholder="Reason shown to user on rejection"
                                className="mt-1 w-full bg-charcoal-dark border border-military-gray p-2 rounded-lg text-white text-sm"
                            />
                        </div>
                    </div>
                )}
            </section>

            <section className="card-tactical space-y-4">
                <h2 className="text-lg font-black uppercase tracking-widest text-white">Recent Signups</h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[40rem] text-sm">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-widest text-gray-500 border-b border-military-gray">
                                <th className="py-2 pr-4">Username</th>
                                <th className="py-2 pr-4">Email</th>
                                <th className="py-2 pr-4">Marketing Opt-In</th>
                                <th className="py-2">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSignups.length > 0 ? (
                                recentSignups.map((entry) => (
                                    <tr key={entry.id} className="border-b border-military-gray/30 text-gray-200">
                                        <td className="py-2 pr-4 font-bold">{entry.username || 'N/A'}</td>
                                        <td className="py-2 pr-4">{entry.email || 'N/A'}</td>
                                        <td className="py-2 pr-4">{entry.marketing_opt_in ? 'Yes' : 'No'}</td>
                                        <td className="py-2">{formatDateTime(entry.created_at)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-gray-500 font-bold uppercase tracking-widest">
                                        No signups yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Admin;
