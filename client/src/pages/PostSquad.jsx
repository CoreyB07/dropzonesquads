import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Info, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createSquad } from '../utils/squadsApi';

const AUDIENCE_OPTIONS = [
    'Open to All',
    'Women Only',
    'Men Only'
];
const COMMS_OPTIONS = ['Game', 'Discord'];
const TAG_OPTIONS = [
    'Chill',
    'Adults Only',
    'Team Player',
    'Mic Only',
    'Good Comms',
    'No Toxicity',
    'Casual Vibes',
    'Competitive',
    'Ranked Grind',
    'Win Focus',
    'High Kills',
    'New Player Friendly',
    'Discord Preferred',
    'Late Night',
    'Weekend Squad'
];
const MAX_TAGS = 6;

const PostSquad = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        gameMode: 'Battle Royale',
        platform: user?.platform || 'PC',
        skillLevel: 'Casual',
        audience: 'Open to All',
        comms: 'Game',
        tags: [],
        description: '',
        maxPlayers: 4
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createSquad({
                ...formData,
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
            navigate('/find');
        } catch (error) {
            console.error('Error posting squad:', error);
            alert('Unable to post squad. Check Supabase setup and table permissions.');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="space-y-2 text-center md:text-left">
                <h1 className="text-4xl font-black uppercase tracking-tighter">Post a Squad</h1>
                <p className="text-gray-400 uppercase text-xs font-bold tracking-widest">Assemble your team for the next drop</p>
            </div>

            <form onSubmit={handleSubmit} className="card-tactical space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Squad Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-500">Squad Name</label>
                        <input
                            name="name"
                            type="text"
                            required
                            placeholder="e.g. Warzone Sweats"
                            className="w-full bg-charcoal-dark border border-military-gray rounded-md py-3 px-4 outline-none focus:border-tactical-yellow transition-all"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Game Mode */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-500">Game Mode</label>
                        <select
                            name="gameMode"
                            className="w-full bg-charcoal-dark border border-military-gray rounded-md py-3 px-4 outline-none focus:border-tactical-yellow transition-all"
                            onChange={handleChange}
                        >
                            <option>Battle Royale</option>
                            <option>Resurgence</option>
                        </select>
                    </div>

                    {/* Platform */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-500">Platform</label>
                        <select
                            name="platform"
                            className="w-full bg-charcoal-dark border border-military-gray rounded-md py-3 px-4 outline-none focus:border-tactical-yellow transition-all"
                            onChange={handleChange}
                        >
                            <option>PC</option>
                            <option>PlayStation</option>
                            <option>Xbox</option>
                            <option>Crossplay</option>
                        </select>
                    </div>

                    {/* Max Players */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-500">Max Players</label>
                        <input
                            name="maxPlayers"
                            type="number"
                            min="2"
                            defaultValue="4"
                            className="w-full bg-charcoal-dark border border-military-gray rounded-md py-3 px-4 outline-none focus:border-tactical-yellow transition-all font-mono"
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Skill, Audience & Comms */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-500">Skill Level</label>
                        <select
                            name="skillLevel"
                            className="w-full bg-charcoal-dark border border-military-gray rounded-md py-3 px-4 outline-none focus:border-tactical-yellow transition-all"
                            onChange={handleChange}
                        >
                            <option>Casual</option>
                            <option>Competitive</option>
                            <option>Ranked</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-500">Audience</label>
                        <select
                            name="audience"
                            className="w-full bg-charcoal-dark border border-military-gray rounded-md py-3 px-4 outline-none focus:border-tactical-yellow transition-all"
                            onChange={handleChange}
                        >
                            {AUDIENCE_OPTIONS.map((audience) => (
                                <option key={audience}>{audience}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-500">Comms</label>
                        <select
                            name="comms"
                            className="w-full bg-charcoal-dark border border-military-gray rounded-md py-3 px-4 outline-none focus:border-tactical-yellow transition-all"
                            onChange={handleChange}
                        >
                            {COMMS_OPTIONS.map((comms) => (
                                <option key={comms}>{comms}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-black uppercase text-gray-500">Tags</label>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {formData.tags.length}/{MAX_TAGS} selected
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TAG_OPTIONS.map((tag) => {
                            const isSelected = formData.tags.includes(tag);
                            const isDisabled = !isSelected && formData.tags.length >= MAX_TAGS;
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    disabled={isDisabled}
                                    className={`px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wide transition-all ${isSelected
                                            ? 'bg-gray-600 border-gray-300 text-gray-100'
                                            : 'bg-charcoal-dark border-military-gray text-gray-300 hover:border-gray-400'
                                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-500">Squad Description (Optional)</label>
                    <textarea
                        name="description"
                        rows="4"
                        placeholder="Tell us what you're looking for..."
                        className="w-full bg-charcoal-dark border border-military-gray rounded-md py-3 px-4 outline-none focus:border-tactical-yellow transition-all"
                        onChange={handleChange}
                    ></textarea>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-md flex gap-3 text-red-400">
                    <Info className="w-5 h-5 shrink-0" />
                    <p className="text-xs leading-relaxed">
                        Your squad listing will remain active until you delete it. Activision IDs are exchanged after acceptance.
                    </p>
                </div>

                <button type="submit" className="w-full btn-tactical py-4 text-lg flex justify-center items-center gap-2">
                    <Send className="w-5 h-5" />
                    Deploy Squad Listing
                </button>
            </form>
        </div>
    );
};

export default PostSquad;
