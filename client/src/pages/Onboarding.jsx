import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { Shield, User, Monitor, Smartphone, Layout, Target } from 'lucide-react';

const Onboarding = () => {
    const navigate = useNavigate();
    const { user, updateUserProfile, loading } = useAuth();
    const { success, error: showError } = useToast();
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        activisionId: '',
        platform: '',
        marketingOptIn: false
    });

    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth', { replace: true });
        } else if (user) {
            // Pre-fill the username based on email/current username if available
            const isPendingUsername = !user.username || user.username === '__pending__' || user.username === user.email?.split('@')[0];
            setFormData(prev => ({
                ...prev,
                username: isPendingUsername ? '' : user.username,
                platform: user.platform === 'PC' || user.platform === 'Xbox' || user.platform === 'PlayStation' ? user.platform : '',
                activisionId: user.activisionId || '',
            }));
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.platform) {
            showError('Please select a combat platform to continue.');
            return;
        }

        if (!formData.username.trim()) {
            showError('Username is required.');
            return;
        }

        setSaving(true);

        try {
            const result = await Promise.race([
                updateUserProfile({
                    username: formData.username,
                    activisionId: formData.activisionId,
                    platform: formData.platform,
                    marketingOptIn: formData.marketingOptIn,
                    marketingOptInAt: formData.marketingOptIn ? new Date().toISOString() : null,
                    shareActivisionIdWithFriends: false,
                    shareActivisionIdWithSquads: false
                }),
                new Promise((resolve) =>
                    setTimeout(() => resolve({ success: false, message: 'Profile update timed out. Please try again.' }), 12000)
                )
            ]);

            if (result.success) {
                success('Profile initialization complete. Welcome operator.');
                navigate('/', { replace: true });
            } else {
                showError(result.message || 'Failed to update profile.');
            }
        } catch (error) {
            console.error('Onboarding failed:', error);
            showError('An unexpected error occurred.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) {
        return <div className="min-h-[80vh] flex items-center justify-center text-tactical-yellow animate-pulse">Loading...</div>;
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-tactical-yellow/10 border border-tactical-yellow/20 mb-4">
                        <Shield className="w-8 h-8 text-tactical-yellow" />
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                        Initial Setup
                    </h1>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
                        Complete your operator profile to continue
                    </p>
                </div>

                <div className="card-tactical border-t-4 border-t-tactical-yellow p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="GhostOperator"
                                        className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-700"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 relative">
                                <label className="text-[12px] font-black uppercase text-tactical-yellow ml-1 animate-pulse flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Activision ID Required for Deployment
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tactical-yellow/70 group-focus-within:text-tactical-yellow transition-colors z-10" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Ghost#1234567"
                                        className="w-full bg-charcoal-dark border-2 border-tactical-yellow/50 rounded-lg py-4 pl-12 pr-4 text-base text-white focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-500 shadow-[0_0_15px_rgba(234,179,8,0.1)] focus:shadow-[0_0_20px_rgba(234,179,8,0.3)] relative z-0"
                                        value={formData.activisionId}
                                        onChange={e => setFormData({ ...formData, activisionId: e.target.value })}
                                    />
                                    {/* Subtle background glow effect */}
                                    <div className="absolute inset-0 bg-tactical-yellow/5 rounded-lg pointer-events-none" />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1 mt-1">
                                    Include the numbers after the # if you have them.
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Combat Platform</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'PlayStation', icon: Layout, baseClass: 'border-blue-500/30 text-blue-500/70', activeClass: 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' },
                                        { id: 'Xbox', icon: Smartphone, baseClass: 'border-green-500/30 text-green-500/70', activeClass: 'bg-green-500/10 border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' },
                                        { id: 'PC', icon: Monitor, baseClass: 'border-yellow-400/30 text-yellow-400/70', activeClass: 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]' }
                                    ].map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, platform: p.id })}
                                            className={`py-3 px-3 rounded-lg border flex flex-col items-center gap-2 transition-all duration-300 ${formData.platform === p.id
                                                ? p.activeClass
                                                : `bg-charcoal-dark/50 hover:bg-charcoal-dark ${p.baseClass}`
                                                }`}
                                        >
                                            <p.icon className={`w-5 h-5 ${formData.platform === p.id ? 'animate-pulse' : ''}`} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">{p.id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl border border-tactical-yellow/30 bg-tactical-yellow/5 p-4 transition-all hover:border-tactical-yellow-hover/60 group cursor-pointer">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Shield className="w-16 h-16 text-tactical-yellow" />
                                </div>
                                <label className="relative flex items-start gap-4 cursor-pointer z-10">
                                    <div className="flex items-center h-5 mt-1">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(formData.marketingOptIn)}
                                            onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-400 bg-transparent text-tactical-yellow focus:ring-tactical-yellow accent-tactical-yellow cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-1 pr-8">
                                        <p className="text-sm font-black uppercase text-tactical-yellow tracking-wide">
                                            VIP Operative Status
                                        </p>
                                        <p className="text-xs text-gray-300 leading-relaxed">
                                            Opt-in for <span className="text-white font-bold">Priority Access</span> to new site features and exclusive invites to community events.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className={`w-full btn-tactical py-4 text-lg mt-6 ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {saving ? 'UPDATING PROFILE...' : 'COMPLETE DEPLOYMENT'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
