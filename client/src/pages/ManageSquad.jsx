import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Save, Shield, Users } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { useMySquads } from '../context/MySquadsContext';
import { normalizeSquad, sanitizeSquadTag, updateSquad } from '../utils/squadsApi';
import { fetchSquadMembers, getMyRoleInSquad, updateMemberRole } from '../utils/squadMembersApi';

const ROLE_OPTIONS = [
    { value: 'recruit', label: 'Recruit' },
    { value: 'member', label: 'Operator' },
    { value: 'veteran', label: 'Veteran' },
    { value: 'co-leader', label: 'Co-Leader' },
];

const GAME_MODE_OPTIONS = ['Battle Royale', 'Resurgence', 'Plunder'];
const PLATFORM_OPTIONS = ['PlayStation', 'Xbox', 'Console', 'PC', 'Crossplay'];
const SKILL_OPTIONS = ['Casual', 'Competitive', 'Ranked'];
const AUDIENCE_OPTIONS = ['Open to All', 'Women Only', 'Men Only'];
const COMMS_OPTIONS = ['Game', 'Discord'];


const parseTags = (value) => Array.from(new Set(
    String(value || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
));

const roleLabel = (role) => ROLE_OPTIONS.find((option) => option.value === role)?.label || 'Leader';

const buildFormState = (squad) => ({
    name: squad?.name || '',
    gameMode: squad?.gameMode || 'Battle Royale',
    platform: squad?.platform || 'Crossplay',
    skillLevel: squad?.skillLevel || 'Casual',
    audience: squad?.audience || 'Open to All',
    comms: squad?.comms || 'Game',
    description: squad?.description || '',
    maxPlayers: String(squad?.maxPlayers || 4),
    acceptingPlayers: squad?.acceptingPlayers !== false,
    tagsInput: Array.isArray(squad?.tags) ? squad.tags.join(', ') : '',
});

const buildSquadChanges = (original, draft, listingType) => {
    const nextName = listingType === 'squad_looking_for_players'
        ? sanitizeSquadTag(draft.name)
        : String(draft.name || '').trim();
    const nextTags = parseTags(draft.tagsInput);
    const prevTags = Array.isArray(original.tags) ? original.tags : [];
    const changes = [];

    if (nextName !== original.name) changes.push(`Clan tag/name: ${original.name} -> ${nextName}`);
    if (draft.gameMode !== original.gameMode) changes.push(`Mode: ${original.gameMode} -> ${draft.gameMode}`);
    if (draft.platform !== original.platform) changes.push(`Platform: ${original.platform} -> ${draft.platform}`);
    if (draft.skillLevel !== original.skillLevel) changes.push(`Skill: ${original.skillLevel} -> ${draft.skillLevel}`);
    if (draft.audience !== original.audience) changes.push(`Audience: ${original.audience} -> ${draft.audience}`);
    if (draft.comms !== original.comms) changes.push(`Comms: ${original.comms} -> ${draft.comms}`);
    if (String(draft.description || '').trim() !== String(original.description || '').trim()) changes.push('Description updated');
    if (String(draft.maxPlayers) !== String(original.maxPlayers)) changes.push(`Max players: ${original.maxPlayers} -> ${draft.maxPlayers}`);
    if (Boolean(draft.acceptingPlayers) !== Boolean(original.acceptingPlayers)) changes.push(`Accepting players: ${original.acceptingPlayers ? 'On' : 'Off'} -> ${draft.acceptingPlayers ? 'On' : 'Off'}`);
    if (prevTags.join('|') !== nextTags.join('|')) changes.push(`Tags: ${prevTags.join(', ') || 'None'} -> ${nextTags.join(', ') || 'None'}`);

    return changes;
};

const ManageSquad = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, applications, updateApplicationStatus } = useAuth();
    const { mySquads } = useMySquads();
    const { success, error: showError } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [squad, setSquad] = useState(null);
    const [originalSquad, setOriginalSquad] = useState(null);
    const [form, setForm] = useState(buildFormState(null));
    const [members, setMembers] = useState([]);
    const [draftRoles, setDraftRoles] = useState({});
    const [canManage, setCanManage] = useState(false);
    const [actingApplicationId, setActingApplicationId] = useState(null);
    const [debugError, setDebugError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);

            if (!user) {
                setCanManage(false);
                setLoading(false);
                return;
            }

            try {
                setDebugError(null);
                const { data, error } = await supabase
                    .from('squads')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                const normalized = normalizeSquad(data);
                const role = await getMyRoleInSquad(id, user.id);
                const allowed = normalized.creatorId === user.id || role === 'leader' || role === 'co-leader';
                const squadMembers = await fetchSquadMembers(id);

                setCanManage(allowed);
                setSquad(normalized);
                setOriginalSquad(normalized);
                setForm(buildFormState(normalized));
                setMembers(squadMembers);
                setDraftRoles(Object.fromEntries(squadMembers.map((member) => [member.id, member.role])));
            } catch (error) {
                const debugPayload = {
                    code: error?.code || 'no-code',
                    message: error?.message || 'unknown error',
                    details: error?.details || null,
                    hint: error?.hint || null,
                    status: error?.status || null
                };
                console.error('Failed to load squad manager:', debugPayload, error);
                setDebugError(debugPayload);
                showError(`Could not load squad management [${debugPayload.code}] ${debugPayload.message}`);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, mySquads, showError, user]);

    const squadChanges = useMemo(
        () => (originalSquad ? buildSquadChanges(originalSquad, form, squad?.listingType) : []),
        [form, originalSquad, squad?.listingType]
    );

    const roleChanges = useMemo(
        () => members
            .filter((member) => member.role !== draftRoles[member.id])
            .map((member) => ({
                id: member.id,
                username: member.username,
                from: member.role,
                to: draftRoles[member.id],
            })),
        [draftRoles, members]
    );

    const hasChanges = squadChanges.length > 0 || roleChanges.length > 0;
    const canDeleteSquad = Boolean(user?.id && squad?.creatorId === user.id);

    const incomingApplications = useMemo(
        () => (applications || []).filter((app) => String(app.squadId) === String(id) && app.status === 'pending'),
        [applications, id]
    );

    const handleApplicationDecision = async (applicationId, status) => {
        if (!applicationId || !status || actingApplicationId) {
            return;
        }

        setActingApplicationId(applicationId);
        try {
            await updateApplicationStatus(applicationId, status);
            success(status === 'accepted' ? 'Request accepted.' : 'Request rejected.');
        } catch (error) {
            console.error('Failed to process join request:', error);
            showError(error?.message || 'Could not process join request.');
        } finally {
            setActingApplicationId(null);
        }
    };

    const handleFieldChange = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: field === 'name' && squad?.listingType === 'squad_looking_for_players'
                ? sanitizeSquadTag(value)
                : value,
        }));
    };

    const handleConfirmSave = async () => {
        if (!squad || !hasChanges) {
            setConfirmOpen(false);
            return;
        }

        setSaving(true);

        try {
            const payload = {
                ...squad,
                name: form.name,
                gameMode: form.gameMode,
                platform: form.platform,
                skillLevel: form.skillLevel,
                audience: form.audience,
                comms: form.comms,
                description: form.description,
                maxPlayers: Number(form.maxPlayers) || squad.maxPlayers,
                acceptingPlayers: form.acceptingPlayers,
                micRequired: squad.micRequired,
                tags: parseTags(form.tagsInput),
                listingType: squad.listingType,
            };

            let nextSquad = squad;

            if (squadChanges.length > 0) {
                nextSquad = await updateSquad(id, payload);
            }

            if (roleChanges.length > 0) {
                for (const change of roleChanges) {
                    await updateMemberRole(id, change.id, change.to);
                }
            }

            const nextMembers = members.map((member) => ({
                ...member,
                role: draftRoles[member.id],
            }));

            setSquad(nextSquad);
            setOriginalSquad(nextSquad);
            setMembers(nextMembers);
            setDraftRoles(Object.fromEntries(nextMembers.map((member) => [member.id, member.role])));
            setConfirmOpen(false);
            success('Squad updates confirmed.');
        } catch (error) {
            console.error('Failed to save squad updates:', error);
            showError(error.message || 'Could not save squad updates.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSquad = async () => {
        if (!canDeleteSquad || deleting) {
            return;
        }

        const confirmed = window.confirm('Delete this squad listing? This cannot be undone.');
        if (!confirmed) {
            return;
        }

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('squads')
                .delete()
                .eq('id', id)
                .eq('creator_id', user.id);

            if (error) {
                throw error;
            }

            success('Squad listing deleted.');
            navigate('/find');
        } catch (error) {
            console.error('Failed to delete squad:', error);
            showError(error.message || 'Could not delete squad listing.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-tactical-yellow animate-pulse">
                <Shield className="w-12 h-12 flex-shrink-0 animate-spin-slow opacity-50" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-3xl mx-auto py-16">
                <div className="card-tactical text-center space-y-4">
                    <AlertTriangle className="w-10 h-10 text-tactical-yellow mx-auto" />
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Membership Required</h2>
                    <p className="text-gray-400 text-sm">Sign in to manage your squad settings and member roles.</p>
                    <Link to="/auth?mode=signup" className="btn-tactical inline-flex justify-center">Create Free Membership</Link>
                </div>
            </div>
        );
    }

    if (!squad || !canManage) {
        return (
            <div className="max-w-3xl mx-auto py-16 space-y-4">
                <div className="card-tactical text-center space-y-4">
                    <AlertTriangle className="w-10 h-10 text-tactical-yellow mx-auto" />
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Access Locked</h2>
                    <p className="text-gray-400 text-sm">Only squad leaders and co-leaders can edit this squad.</p>
                    <button onClick={() => navigate(`/squad/${id}`)} className="btn-tactical w-full">Back to Squad</button>
                </div>
                {debugError && (
                    <div className="alert-error">
                        <p className="alert-error-title">Manage Squad Debug</p>
                        <pre className="alert-error-body">{JSON.stringify(debugError, null, 2)}</pre>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <button onClick={() => navigate(`/squad/${id}`)} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-black uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Back to Squad
            </button>

            <section className="card-tactical space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Squad Control</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Manage Squad</h1>
                        <p className="text-sm text-gray-400">Edit squad details, update member roles, then confirm before anything is saved.</p>
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-tactical-yellow">
                        {squad.listingType === 'squad_looking_for_players' ? 'Clan tag rules active' : 'LFG post edit mode'}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Clan Tag / Post Name</label>
                            <input
                                value={form.name}
                                maxLength={squad.listingType === 'squad_looking_for_players' ? 5 : undefined}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow"
                            />
                            {squad.listingType === 'squad_looking_for_players' && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Letters only. Max 5 characters.</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Game Mode</span>
                                <select value={form.gameMode} onChange={(e) => handleFieldChange('gameMode', e.target.value)} className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow">
                                    {GAME_MODE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Platform</span>
                                <select value={form.platform} onChange={(e) => handleFieldChange('platform', e.target.value)} className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow">
                                    {PLATFORM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Skill Level</span>
                                <select value={form.skillLevel} onChange={(e) => handleFieldChange('skillLevel', e.target.value)} className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow">
                                    {SKILL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Audience</span>
                                <select value={form.audience} onChange={(e) => handleFieldChange('audience', e.target.value)} className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow">
                                    {AUDIENCE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Comms</span>
                                <select value={form.comms} onChange={(e) => handleFieldChange('comms', e.target.value)} className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow">
                                    {COMMS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Max Players</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.maxPlayers}
                                    onChange={(e) => handleFieldChange('maxPlayers', e.target.value)}
                                    className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow"
                                />
                            </label>
                        </div>

                        <label className="flex items-center gap-3 rounded-lg border border-military-gray bg-charcoal-dark px-4 py-3">
                            <input
                                type="checkbox"
                                checked={form.acceptingPlayers}
                                onChange={(e) => handleFieldChange('acceptingPlayers', e.target.checked)}
                                className="h-4 w-4 accent-tactical-yellow"
                            />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-300">Accepting new players</span>
                        </label>

                        <label className="space-y-2 block">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Description</span>
                            <textarea
                                rows="5"
                                value={form.description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow"
                            />
                        </label>

                        <label className="space-y-2 block">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tags</span>
                            <input
                                value={form.tagsInput}
                                onChange={(e) => handleFieldChange('tagsInput', e.target.value)}
                                placeholder="ranked, crossplay, chill"
                                className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow"
                            />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Separate tags with commas.</p>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-military-gray bg-charcoal-dark/60 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-tactical-yellow" />
                                <p className="text-sm font-black uppercase tracking-widest text-white">Join Requests</p>
                            </div>
                            {incomingApplications.length === 0 ? (
                                <p className="text-xs text-gray-400">No pending requests right now.</p>
                            ) : (
                                <div className="space-y-2">
                                    {incomingApplications.map((app) => (
                                        <div key={app.id} className="rounded-lg border border-military-gray bg-charcoal-dark p-3 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-wide text-white">{app.applicantUsername || 'Unknown'}</p>
                                                <p className="text-[11px] uppercase tracking-widest text-gray-500">{app.applicantPlatform || 'PC'} / {app.role || 'Operator'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplicationDecision(app.id, 'rejected')}
                                                    disabled={actingApplicationId === app.id}
                                                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-300 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplicationDecision(app.id, 'accepted')}
                                                    disabled={actingApplicationId === app.id}
                                                    className="rounded-lg bg-tactical-yellow px-3 py-2 text-[10px] font-black uppercase tracking-widest text-charcoal-dark disabled:opacity-50"
                                                >
                                                    Accept
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-military-gray bg-charcoal-dark/60 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-tactical-yellow" />
                                <p className="text-sm font-black uppercase tracking-widest text-white">Member Roles</p>
                            </div>
                            <p className="text-xs text-gray-400">Leaders can stage badge changes here. Changes are only applied after confirmation.</p>
                        </div>

                        <div className="space-y-3">
                            {members.map((member) => {
                                const isLeader = member.role === 'leader';
                                return (
                                    <div key={member.id} className="rounded-xl border border-military-gray bg-charcoal-dark/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-black uppercase tracking-wide text-white">{member.username || 'Unknown Operator'}</p>
                                            <p className="text-[11px] uppercase tracking-widest text-gray-500">{member.platform || 'PC'} / {roleLabel(member.role)}</p>
                                        </div>
                                        {isLeader ? (
                                            <span className="inline-flex items-center justify-center rounded-lg border border-red-500/35 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-red-300">
                                                Locked Leader
                                            </span>
                                        ) : (
                                            <select
                                                value={draftRoles[member.id] || member.role}
                                                onChange={(e) => setDraftRoles((current) => ({ ...current, [member.id]: e.target.value }))}
                                                className="w-full sm:w-44 bg-charcoal-dark border border-military-gray rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-tactical-yellow"
                                            >
                                                {ROLE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-tactical-yellow/30 bg-tactical-yellow/5 px-4 py-3 text-sm text-gray-300">
                    Nothing saves immediately. Use <span className="font-black uppercase text-tactical-yellow">Review and Confirm</span> to inspect the changes first.
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/squad/${id}`)}
                        className="flex-1 rounded-lg border border-military-gray bg-charcoal-dark px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-300"
                    >
                        Cancel
                    </button>
                    {canDeleteSquad && (
                        <button
                            type="button"
                            onClick={handleDeleteSquad}
                            disabled={deleting}
                            className="flex-1 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-300 disabled:opacity-50"
                        >
                            {deleting ? 'Deleting...' : 'Delete Listing'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        disabled={!hasChanges}
                        className="flex-[2] inline-flex items-center justify-center gap-2 rounded-lg bg-tactical-yellow px-4 py-3 text-xs font-black uppercase tracking-widest text-charcoal-dark disabled:opacity-40"
                    >
                        <Save className="w-4 h-4" />
                        Review and Confirm
                    </button>
                </div>
            </section>

            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-dark/90 backdrop-blur-sm">
                    <div className="card-tactical max-w-2xl w-full space-y-5">
                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Confirm Squad Changes</p>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Review before saving</h2>
                            <p className="text-sm text-gray-400">This step helps prevent accidental edits. Nothing updates until you confirm below.</p>
                        </div>

                        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                            <div className="rounded-xl border border-military-gray bg-charcoal-dark/70 p-4 space-y-2">
                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">Squad Details</p>
                                {squadChanges.length > 0 ? (
                                    squadChanges.map((change) => (
                                        <div key={change} className="text-sm text-gray-200">{change}</div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500">No squad detail changes staged.</div>
                                )}
                            </div>

                            <div className="rounded-xl border border-military-gray bg-charcoal-dark/70 p-4 space-y-2">
                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">Member Role Changes</p>
                                {roleChanges.length > 0 ? (
                                    roleChanges.map((change) => (
                                        <div key={change.id} className="text-sm text-gray-200">
                                            {change.username}: {roleLabel(change.from)} {'->'} {roleLabel(change.to)}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500">No member role changes staged.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(false)}
                                disabled={saving}
                                className="flex-1 rounded-lg border border-military-gray bg-charcoal-dark px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-300"
                            >
                                Keep Editing
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSave}
                                disabled={saving}
                                className="flex-[2] inline-flex items-center justify-center gap-2 rounded-lg bg-tactical-yellow px-4 py-3 text-xs font-black uppercase tracking-widest text-charcoal-dark disabled:opacity-40"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {saving ? 'Saving Changes...' : 'Confirm Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSquad;
