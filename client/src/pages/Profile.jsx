import React, { useState, useEffect } from 'react';
import { Shield, Monitor, Target, Pencil, X, Check, LogOut, ShieldCheck, Users, Trophy, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { useToast } from '../context/useToast';
import { useMySquads } from '../context/MySquadsContext';
import SquadNameText from '../components/SquadNameText';
import BadgeChip from '../components/BadgeChip';

const PlatformBadge = ({ platform }) => {
    const map = {
        PlayStation: { color: 'text-blue-400 border-blue-500/40 bg-blue-500/10', label: 'PlayStation' },
        Xbox: { color: 'text-green-400 border-green-500/40 bg-green-500/10', label: 'Xbox' },
        PC: { color: 'text-tactical-yellow border-tactical-yellow/40 bg-tactical-yellow/10', label: 'PC' },
    };
    const s = map[platform] ?? map.PC;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${s.color}`}>
            <Monitor className="w-3 h-3" /> {s.label}
        </span>
    );
};

const InfoRow = ({ label, value, highlight, valueNode, valueClassName = '' }) => (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-military-gray/30 last:border-0">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
        {valueNode || (
            <span className={`text-base font-bold ${highlight ? 'text-tactical-yellow' : 'text-white'} ${valueClassName}`}>{value}</span>
        )}
    </div>
);

const SummaryCard = ({ icon: Icon, title, eyebrow, children, accent = 'orange' }) => {
    const accentClasses = {
        orange: 'bg-tactical-yellow/10 border-tactical-yellow/25 text-tactical-yellow',
        blue: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
        bronze: 'bg-premium-gold/10 border-premium-gold/25 text-premium-gold-soft',
    };

    return (
        <div className="card-tactical relative overflow-hidden min-h-[250px] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_36%)]">
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: 'linear-gradient(90deg,#fff 1px,transparent 1px),linear-gradient(#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }}
            />
            <div className="relative z-10 space-y-5">
                <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border ${accentClasses[accent]}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
                        <p className="text-base font-black uppercase tracking-wide text-white mt-1">{title}</p>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
};

const SnapshotItem = ({ label, value, tone = 'default' }) => {
    const toneClasses = {
        default: 'text-white',
        muted: 'text-slate-300',
        blue: 'text-blue-300',
        green: 'text-green-300',
        bronze: 'text-premium-gold-soft',
    };

    return (
        <div className="flex items-center justify-between gap-4 py-3 border-b border-military-gray/30 last:border-0">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
            <span className={`text-sm font-bold uppercase tracking-wide ${toneClasses[tone]}`}>{value}</span>
        </div>
    );
};

const SquadRoleBadge = ({ role }) => {
    const roleStyles = {
        leader: 'border-red-500/35 bg-transparent text-red-300',
        'co-leader': 'border-orange-300/45 bg-transparent text-orange-200',
        member: 'border-military-gray bg-charcoal-dark text-slate-300',
        recruit: 'border-military-gray bg-charcoal-dark text-slate-400',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.14em] shadow-none ${roleStyles[role] || roleStyles.member}`}>
            {role === 'leader' ? <Crown className="w-3 h-3" /> : null}
            {(role || 'member').replace('-', ' ')}
        </span>
    );
};

const Profile = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const { user, updateUserProfile, logout, loading } = useAuth();
    const { mySquads } = useMySquads();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [badgesBySquad, setBadgesBySquad] = useState({});
    const [form, setForm] = useState({ username: '', activisionId: '', shareActivisionIdWithFriends: false, shareActivisionIdWithSquads: false, platform: 'PC' });
    const isProfileSetupMode = new URLSearchParams(location.search).get('setup') === '1';

    useEffect(() => {
        const loadMyBadges = async () => {
            if (!user?.id) return;
            const { data, error } = await supabase
                .from('member_badges')
                .select('squad_id, badge_id, badge:badge_id(label, category, description, icon), expires_at')
                .eq('user_id', user.id)
                .is('expires_at', null);

            if (!error && data) {
                const grouped = data.reduce((acc, row) => {
                    if (!row?.badge?.label) return acc;
                    acc[row.squad_id] = acc[row.squad_id] || [];
                    acc[row.squad_id].push({ id: row.badge_id, label: row.badge.label, category: row.badge.category, icon: row.badge.icon || '', description: row.badge.description || '' });
                    return acc;
                }, {});
                setBadgesBySquad(grouped);
            }
        };

        loadMyBadges();
    }, [user?.id, mySquads.length]);

    const openEditor = () => {
        setForm({
            username: user?.username ?? '',
            activisionId: user?.activisionId ?? '',
            shareActivisionIdWithFriends: user?.shareActivisionIdWithFriends ?? false,
            shareActivisionIdWithSquads: user?.shareActivisionIdWithSquads ?? false,
            platform: user?.platform ?? 'PC',
        });
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        setIsSaving(true);
        const result = await updateUserProfile(form);
        if (result.success) {
            success('Operator loadout updated.');
            setIsEditing(false);
        } else {
            showError(result.message || 'Unable to update profile.');
        }
        setIsSaving(false);
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        navigate('/', { replace: true });
        success('Signed out.');
        setIsLoggingOut(false);
    };

    if (loading) {
        return (
            <div className="max-w-xl mx-auto py-16">
                <div className="card-tactical text-center space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Loading Profile...</h2>
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
                    <p className="text-gray-400 text-sm">Create a free account to manage your profile.</p>
                    <button onClick={() => navigate('/auth')} className="btn-tactical w-full">Sign In / Create Free Account</button>
                </div>
            </div>
        );
    }

    const hasActivisionId = (user?.activisionId || '').trim().length > 0;
    const joinedSquadsCount = mySquads.length;
    const leadershipCount = mySquads.filter((squad) => squad.role === 'leader' || squad.role === 'co-leader').length;
    const isSupporter = Boolean(user?.isSupporter || user?.supporter);
    const showSupporterView = isSupporter;
    const descriptor = hasActivisionId
        ? 'Tactical, squad-focused operator'
        : 'Activision ID is optional — you can add it anytime.';

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-6 text-white">
            {isProfileSetupMode && !isEditing && (
                <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-xl border border-tactical-yellow/40 bg-tactical-yellow/5">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Complete your operator profile</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Set your username/platform now. Activision ID is optional and can be added later.</p>
                    </div>
                    <button
                        onClick={openEditor}
                        className="shrink-0 px-4 py-2 rounded-lg bg-tactical-yellow text-charcoal-dark text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                        Edit Profile
                    </button>
                </div>
            )}

            <div className="relative overflow-hidden rounded-[1.75rem] border border-military-gray bg-charcoal-light shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_38%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 p-7 lg:p-8">
                    <div className="min-w-0">
                        <div className="flex items-start justify-between gap-5 flex-wrap">
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Operator Identity</p>
                                    <h1 className="flex items-center gap-2.5 text-4xl md:text-5xl font-black uppercase tracking-[-0.04em] leading-none text-white">
                                        {showSupporterView && <Trophy className="w-8 h-8 text-premium-gold-soft shrink-0" />}
                                        <span
                                            className={showSupporterView ? 'text-premium-glow inline-block' : ''}
                                            data-text={showSupporterView ? (user?.username || 'OPERATOR') : undefined}
                                        >
                                            {user?.username || 'OPERATOR'}
                                        </span>
                                    </h1>
                                    <p className="text-sm md:text-[15px] text-slate-300 max-w-2xl leading-relaxed">
                                        {descriptor}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    <PlatformBadge platform={user?.platform || 'PC'} />
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-black uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Active Operative
                                    </span>
                                    {showSupporterView && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-premium-gold/35 bg-premium-gold/10 text-premium-gold-soft text-xs font-black uppercase tracking-wider">
                                            <Trophy className="w-3 h-3" />
                                            {isSupporter ? 'Supporter' : 'Supporter Preview'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="flex flex-col items-stretch sm:items-end gap-2.5 ml-auto">
                                    <button
                                        onClick={openEditor}
                                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-military-gray bg-charcoal-dark text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white hover:border-gray-400 transition-all"
                                    >
                                        <Pencil className="w-3 h-3" /> Edit Profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="inline-flex items-center justify-center sm:justify-end gap-1.5 px-2 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-60"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {!hasActivisionId && (
                            <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-tactical-yellow/30 bg-tactical-yellow/5 text-[11px] font-black uppercase tracking-[0.16em] text-tactical-yellow">
                                Setup Needed
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!isEditing && (
                <div className="grid grid-cols-1 gap-4">
                    <div className="card-tactical bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%)]">
                        <div className="mb-5">
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Operator Overview</h2>
                                <p className="text-sm text-slate-400 mt-1">Core identity and account details tied directly to this operator.</p>
                            </div>
                        </div>
                        <InfoRow
                            label="Activision ID"
                            value={hasActivisionId ? user.activisionId : 'Not Set'}
                            highlight={!hasActivisionId}
                            valueClassName={hasActivisionId ? 'font-mono' : 'uppercase tracking-wide'}
                        />
                        <InfoRow
                            label="Platform"
                            value={user?.platform || 'PC'}
                        />
                        <InfoRow
                            label="ID Sharing"
                            value={(user?.shareActivisionIdWithFriends || user?.shareActivisionIdWithSquads) ? 'Shared By Relationship Rules' : 'Private'}
                        />
                        <InfoRow
                            label="Account Status"
                            valueNode={
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/25 bg-blue-500/10 text-blue-300 text-[11px] font-black uppercase tracking-wider">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Verified Operative
                                </span>
                            }
                        />
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="card-tactical border-t-2 border-t-tactical-yellow">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-black uppercase tracking-widest text-tactical-yellow">Edit Operator Loadout</h2>
                        <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    className="w-full bg-charcoal-dark border border-military-gray p-3 rounded-lg text-white outline-none focus:border-tactical-yellow transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase text-tactical-yellow tracking-widest flex items-center gap-1.5">
                                    <Target className="w-3 h-3" /> Activision ID
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Ghost#1234567"
                                    value={form.activisionId}
                                    onChange={(e) => setForm({ ...form, activisionId: e.target.value })}
                                    className="w-full bg-charcoal-dark border-2 border-tactical-yellow/50 p-3 rounded-lg text-white outline-none focus:border-tactical-yellow transition-all placeholder:text-gray-600 shadow-[0_0_15px_rgba(234,179,8,0.08)] focus:shadow-[0_0_20px_rgba(234,179,8,0.25)]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Platform</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['PC', 'PlayStation', 'Xbox'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setForm({ ...form, platform: p })}
                                            className={`py-2.5 rounded-lg border text-[10px] font-black uppercase transition-all ${form.platform === p
                                                ? 'bg-tactical-yellow/10 border-tactical-yellow text-tactical-yellow'
                                                : 'bg-charcoal-dark border-military-gray text-gray-500 hover:border-gray-400 hover:text-gray-300'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Privacy</label>
                                <label className="flex items-center gap-3 p-3 rounded-lg border border-military-gray bg-charcoal-dark cursor-pointer hover:border-gray-400 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={form.shareActivisionIdWithFriends}
                                        onChange={(e) => setForm({ ...form, shareActivisionIdWithFriends: e.target.checked })}
                                        className="w-4 h-4 rounded accent-tactical-yellow"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-white">Share with accepted friends</p>
                                        <p className="text-[10px] text-gray-500">Only friends you accepted can view</p>
                                    </div>
                                </label>
                                <label className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-military-gray bg-charcoal-dark cursor-pointer hover:border-gray-400 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={form.shareActivisionIdWithSquads}
                                        onChange={(e) => setForm({ ...form, shareActivisionIdWithSquads: e.target.checked })}
                                        className="w-4 h-4 rounded accent-tactical-yellow"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-white">Share with squad members</p>
                                        <p className="text-[10px] text-gray-500">Only members in shared squads can view</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={isSaving} className="btn-tactical px-8 flex items-center gap-2 disabled:opacity-60">
                                <Check className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-md border border-military-gray text-xs font-black uppercase text-gray-400 hover:text-white transition-all">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <ProfileDetailsSection
                user={user}
                mySquads={mySquads}
                badgesBySquad={badgesBySquad}
                isSupporter={isSupporter}
                showSupporterView={showSupporterView}
            />
        </div>
    );
};

const ProfileDetailsSection = ({ user, mySquads, badgesBySquad, isSupporter, showSupporterView }) => {
    if (!user) return null;

    const joinedSquadsCount = mySquads.length;
    const leadershipCount = mySquads.filter((squad) => squad.role === 'leader' || squad.role === 'co-leader').length;
    const supporterState = user?.isSupporter ? 'Supporter Active' : 'Standard Access';
    const publicVisibility = (user?.shareActivisionIdWithFriends || user?.shareActivisionIdWithSquads) ? 'Conditional Share' : 'Private Access';

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <SummaryCard icon={Users} title="Joined Squads" eyebrow="Operator Network" accent="blue">
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-military-gray/30">
                        <p className="text-[11px] text-slate-400">
                            {joinedSquadsCount === 0 ? 'No linked squads yet.' : `${joinedSquadsCount} linked squad${joinedSquadsCount !== 1 ? 's' : ''}.`}
                        </p>
                        <span className="inline-flex min-w-[2rem] justify-center px-2 py-1 rounded-full border border-blue-500/25 bg-blue-500/10 text-blue-300 text-[11px] font-black uppercase tracking-widest">
                            {joinedSquadsCount}
                        </span>
                    </div>
                    {joinedSquadsCount > 0 ? (
                        <div className="space-y-2">
                            {mySquads.slice(0, 4).map((squad) => (
                                <div key={squad.id} className="flex items-center justify-between p-3 rounded-lg bg-charcoal-dark border border-military-gray gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase">
                                            <SquadNameText name={squad.name} restClassName="text-white" />
                                        </p>
                                        <p className="text-[10px] text-gray-500">{squad.gameMode || 'Squad Listing'} · {squad.platform || 'Platform Unset'}</p>
                                        {(badgesBySquad?.[squad.id] || []).length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {(badgesBySquad[squad.id] || []).slice(0, 3).map((badge) => (
                                                    <BadgeChip key={`${squad.id}-${badge.id}`} label={badge.label} category={badge.category} icon={badge.icon} description={badge.description} compact />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <SquadRoleBadge role={squad.role} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-military-gray bg-charcoal-dark/40 px-4 py-6 text-sm text-slate-400">
                            Join or create a squad to start building your operator network.
                        </div>
                    )}
                </SummaryCard>

                <SummaryCard icon={ShieldCheck} title="Account Access" eyebrow="Account Intel" accent="bronze">
                    <div className="space-y-1">
                        <SnapshotItem label="Linked Email" value={user?.email || 'No Email'} tone="muted" />
                        <SnapshotItem label="Supporter Access" value={supporterState} tone={showSupporterView ? 'bronze' : 'muted'} />
                        <SnapshotItem label="Leadership Roles" value={`${leadershipCount}`} tone={leadershipCount > 0 ? 'blue' : 'muted'} />
                    </div>
                    <div className="rounded-xl border border-military-gray/70 bg-charcoal-dark/50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Visibility Rule</p>
                        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                            {user?.activisionId
                                ? `${publicVisibility}. Squad leaders only see your Activision ID after acceptance based on your friend/squad sharing toggles.`
                                : 'Activision ID is optional. You can still join squads, add friends, and use messaging without it.'}
                        </p>
                    </div>
                </SummaryCard>
            </div>
    );
};

export default Profile;
