import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Info, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { createSquad, isValidSquadTag, sanitizeSquadTag } from '../utils/squadsApi';

const AUDIENCE_OPTIONS = [
    'Open to All',
    'Women Only',
    'Men Only'
];
const COMMS_OPTIONS = ['Game', 'Discord'];
const TAG_GROUPS = [
    {
        name: 'Mindset & Vibe',
        tags: ['Laid Back', 'Locked In', 'Positive Only', 'No Drama']
    },
    {
        name: 'Team Behavior',
        tags: ['Callouts Matter', 'Stick Together', 'Objective Focused', 'Supportive']
    },
    {
        name: 'Session & Experience',
        tags: ['Night Crew', 'Weekend Runs', 'Beginner Friendly', 'Win Minded']
    }
];
const MAX_TAGS = 3;

const PostSquad = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const { success, error: showError } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        listingType: 'squad_looking_for_players',
        name: '',
        gameMode: 'Battle Royale',
        platform: user?.platform || 'PC',
        skillLevel: 'Casual',
        audience: 'Open to All',
        comms: 'Game',
        tags: [],
        description: '',
        maxPlayers: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextName = formData.listingType === 'squad_looking_for_players'
            ? sanitizeSquadTag(formData.name)
            : formData.name.trim();

        if (formData.listingType === 'squad_looking_for_players' && !isValidSquadTag(nextName)) {
            showError('Clan tag must be 1 to 5 letters only.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createSquad({
                ...formData,
                name: nextName,
                maxPlayers: formData.listingType === 'player_looking_for_squad' && !formData.maxPlayers ? 99 : formData.maxPlayers,
                creatorId: user.id,
                tags: Array.from(
                    new Set([
                        ...formData.tags,
                        formData.gameMode,
                        formData.skillLevel,
                        formData.platform,
                        formData.audience,
                        formData.comms
                    ])
                )
            });
            success('Squad listing deployed successfully.');
            navigate('/find');
        } catch (error) {
            console.error('Error posting squad:', error);

            const message = String(error?.message || '').toLowerCase();
            const code = error?.code;

            if (code === '23503' || message.includes('foreign key') || message.includes('creator_id')) {
                showError('Session expired or account record changed. Please sign out, refresh, and sign back in.');
            } else if (message.includes('duplicate key') || code === '23505') {
                showError('A conflicting record already exists. Try a different listing name or refresh and retry.');
            } else {
                showError(error?.message || 'Unable to deploy squad listing right now.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'name' && formData.listingType === 'squad_looking_for_players'
                ? sanitizeSquadTag(value)
                : value
        });
    };

    const toggleTag = (tag) => {
        setFormData((prev) => {
            const alreadySelected = prev.tags.includes(tag);
            if (alreadySelected) {
                return {
                    ...prev,
                    tags: prev.tags.filter((t) => t !== tag)
                };
            }

            if (prev.tags.length >= MAX_TAGS) {
                return prev;
            }

            return {
                ...prev,
                tags: [...prev.tags, tag]
            };
        });
    };

    if (loading) {
        return (
            <div className="max-w-xl mx-auto py-16">
                <div className="card-tactical text-center space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Checking account...</h2>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-xl mx-auto py-16">
                <div className="card-tactical text-center space-y-4">
                    <Lock className="w-10 h-10 text-tactical-yellow mx-auto" />
                    <h2 className="text-2xl font-black uppercase tracking-tight">Sign In Required</h2>
                    <p className="text-gray-400 text-sm">
                        You need an account to post a squad.
                    </p>
                    <button
                        onClick={() => navigate('/auth')}
                        className="btn-tactical w-full"
                    >
                        Sign In / Register
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="space-y-3 mb-8 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Post a Squad</h1>
                <p className="text-gray-400 font-medium">Build your team for the next drop. Set your mode, vibe, and requirements.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Segmented Choice */}
                <div className="card-tactical p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-military-gray/50 pb-3 mb-5">Listing Type</h3>
                    <div className="flex bg-charcoal-dark border border-military-gray p-1.5 rounded-lg shadow-inner">
                        <button
                            type="button"
                            onClick={() => setFormData({
                                ...formData,
                                listingType: 'squad_looking_for_players',
                                name: sanitizeSquadTag(formData.name)
                            })}
                            className={`flex-1 py-3 text-xs md:text-sm font-black uppercase tracking-widest rounded-md transition-all ${formData.listingType === 'squad_looking_for_players'
                                ? 'bg-tactical-yellow text-charcoal-dark shadow-md'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Need Players
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, listingType: 'player_looking_for_squad' })}
                            className={`flex-1 py-3 text-xs md:text-sm font-black uppercase tracking-widest rounded-md transition-all ${formData.listingType === 'player_looking_for_squad'
                                ? 'bg-tactical-yellow text-charcoal-dark shadow-md'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Looking for Squad
                        </button>
                    </div>
                </div>

                {/* Section 1 - Basic Info */}
                <div className="card-tactical p-6 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-military-gray/50 pb-3">Squad Setup</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Squad Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400">
                                {formData.listingType === 'player_looking_for_squad' ? 'Post Title' : 'Clan Tag'}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                name="name"
                                type="text"
                                autoComplete="off"
                                required
                                value={formData.name}
                                maxLength={formData.listingType === 'player_looking_for_squad' ? undefined : 5}
                                pattern={formData.listingType === 'player_looking_for_squad' ? undefined : '[A-Za-z]{1,5}'}
                                placeholder={formData.listingType === 'player_looking_for_squad' ? 'e.g. Solo Slayer LFG' : 'e.g. REAP'}
                                title={formData.listingType === 'player_looking_for_squad' ? undefined : 'Use 1 to 5 letters only.'}
                                autoCapitalize={formData.listingType === 'player_looking_for_squad' ? undefined : 'characters'}
                                spellCheck={formData.listingType === 'player_looking_for_squad' ? undefined : false}
                                className="w-full bg-charcoal-dark/50 border border-military-gray text-white rounded-md py-3 px-4 outline-none focus:border-tactical-yellow focus:bg-charcoal-dark transition-all placeholder-gray-600 shadow-inner"
                                onChange={handleChange}
                            />
                            {formData.listingType === 'squad_looking_for_players' && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    Letters only. Max 5 characters.
                                </p>
                            )}
                        </div>

                        {/* Game Mode */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400">Game Mode <span className="text-red-500">*</span></label>
                            <select
                                name="gameMode"
                                value={formData.gameMode}
                                className="w-full bg-charcoal-dark/50 border border-military-gray text-white rounded-md py-3 px-4 outline-none focus:border-tactical-yellow focus:bg-charcoal-dark transition-all shadow-inner"
                                onChange={handleChange}
                                required
                            >
                                <option value="Battle Royale">Battle Royale</option>
                                <option value="Resurgence">Resurgence</option>
                            </select>
                        </div>

                        {/* Platform */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400">Platform <span className="text-red-500">*</span></label>
                            <select
                                name="platform"
                                value={formData.platform}
                                className="w-full bg-charcoal-dark/50 border border-military-gray text-white rounded-md py-3 px-4 outline-none focus:border-tactical-yellow focus:bg-charcoal-dark transition-all shadow-inner"
                                onChange={handleChange}
                                required
                            >
                                <option value="PlayStation">PlayStation</option>
                                <option value="Xbox">Xbox</option>
                                <option value="Console">Console</option>
                                <option value="PC">PC</option>
                                <option value="Crossplay">Crossplay</option>
                            </select>
                        </div>

                        {/* Max Players */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400">
                                Max Players
                                <span className="text-[10px] text-gray-500 ml-2 normal-case">(Optional)</span>
                            </label>
                            <input
                                name="maxPlayers"
                                type="number"
                                min="2"
                                placeholder="Any"
                                value={formData.maxPlayers}
                                className="w-full bg-charcoal-dark/50 border border-military-gray text-white rounded-md py-3 px-4 outline-none focus:border-tactical-yellow focus:bg-charcoal-dark transition-all font-mono placeholder-gray-500 shadow-inner"
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2 - Preferences */}
                <div className="card-tactical p-6 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-military-gray/50 pb-3">Team Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400">Playstyle / Skill <span className="text-red-500">*</span></label>
                            <select
                                name="skillLevel"
                                value={formData.skillLevel}
                                className="w-full bg-charcoal-dark/50 border border-military-gray text-white rounded-md py-3 px-4 outline-none focus:border-tactical-yellow focus:bg-charcoal-dark transition-all shadow-inner"
                                onChange={handleChange}
                                required
                            >
                                <option value="Casual">Casual</option>
                                <option value="Competitive">Competitive</option>
                                <option value="Ranked">Ranked</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400">Squad Type <span className="text-red-500">*</span></label>
                            <select
                                name="audience"
                                value={formData.audience}
                                className="w-full bg-charcoal-dark/50 border border-military-gray text-white rounded-md py-3 px-4 outline-none focus:border-tactical-yellow focus:bg-charcoal-dark transition-all shadow-inner"
                                onChange={handleChange}
                                required
                            >
                                {AUDIENCE_OPTIONS.map((audience) => (
                                    <option key={audience} value={audience}>{audience}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400">Comms <span className="text-red-500">*</span></label>
                            <select
                                name="comms"
                                value={formData.comms}
                                className="w-full bg-charcoal-dark/50 border border-military-gray text-white rounded-md py-3 px-4 outline-none focus:border-tactical-yellow focus:bg-charcoal-dark transition-all shadow-inner"
                                onChange={handleChange}
                                required
                            >
                                {COMMS_OPTIONS.map((comms) => (
                                    <option key={comms} value={comms}>{comms}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 3 - Tags */}
                <div className="card-tactical p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-military-gray/50 pb-3">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Squad Vibe</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-tactical-yellow bg-tactical-yellow/10 px-2 py-1 rounded">
                            {formData.tags.length}/{MAX_TAGS} Selected
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {TAG_GROUPS.map((group) => (
                            <div key={group.name} className="space-y-3">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500">{group.name}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {group.tags.map((tag) => {
                                        const isSelected = formData.tags.includes(tag);
                                        const isDisabled = !isSelected && formData.tags.length >= MAX_TAGS;
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                disabled={isDisabled}
                                                className={`px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wide transition-all ${isSelected
                                                    ? 'bg-tactical-yellow border-tactical-yellow text-charcoal-dark shadow-[0_0_10px_rgba(255,154,31,0.2)]'
                                                    : 'bg-charcoal-dark/50 border-military-gray text-gray-300 hover:border-gray-400 hover:bg-charcoal-dark'
                                                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4 - Description */}
                <div className="card-tactical p-6 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-military-gray/50 pb-3">Additional Details</h3>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400">
                            Description
                            <span className="text-[10px] text-gray-500 ml-2 normal-case">(Optional details about playstyle, schedule, or requirements)</span>
                        </label>
                        <textarea
                            name="description"
                            rows="4"
                            placeholder="Tell us what you're looking for..."
                            className="w-full bg-charcoal-dark/50 border border-military-gray text-white rounded-md py-3 px-4 outline-none focus:border-tactical-yellow focus:bg-charcoal-dark transition-all placeholder-gray-600 shadow-inner"
                            onChange={handleChange}
                        ></textarea>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="space-y-6">
                    <div className="bg-charcoal-dark border border-military-gray p-4 rounded-md flex gap-3 text-gray-400 shadow-sm">
                        <Info className="w-5 h-5 shrink-0 text-gray-500" />
                        <p className="text-xs leading-relaxed">
                            Your squad listing will remain active until you delete it or it fills up. Activision IDs are only exchanged securely after acceptance.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/find')}
                            className="flex-1 py-4 text-sm font-black uppercase tracking-widest rounded transition-colors bg-charcoal-dark border border-military-gray text-gray-400 hover:text-white hover:border-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-4 text-lg font-black rounded-xl bg-white text-charcoal-dark border border-white flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-[#fff5dc] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                            {isSubmitting ? 'Deploying Listing...' : 'Deploy Squad Listing'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PostSquad;
