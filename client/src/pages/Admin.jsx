import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Shield, Users, Megaphone, Crown, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAdminStats, fetchRecentSignups } from '../utils/adminApi';

const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
};

const Admin = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const { error: showError } = useToast();
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalSquads: 0,
        totalSupporters: 0,
        totalSubscribers: 0
    });
    const [recentSignups, setRecentSignups] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    const canAccess = Boolean(user?.isAdmin);

    const loadAdminData = useCallback(async () => {
        if (!canAccess) {
            return;
        }

        setIsFetching(true);
        try {
            const [nextStats, nextSignups] = await Promise.all([
                fetchAdminStats(),
                fetchRecentSignups(15)
            ]);
            setStats(nextStats);
            setRecentSignups(nextSignups);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            showError(error?.message || 'Unable to load admin dashboard data.');
        } finally {
            setIsFetching(false);
        }
    }, [canAccess, showError]);

    useEffect(() => {
        if (loading || !canAccess) {
            if (!loading) {
                setIsFetching(false);
            }
            return;
        }

        loadAdminData();
    }, [loading, canAccess, loadAdminData]);

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
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Admin Dashboard</h1>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-2">
                        Site metrics (Cloudflare handles visitor analytics)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadAdminData}
                    disabled={isFetching}
                    className="px-4 py-2 rounded-md border border-military-gray text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white hover:border-gray-400 disabled:opacity-50"
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
                <h2 className="text-lg font-black uppercase tracking-widest text-white">Recent Signups</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
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
