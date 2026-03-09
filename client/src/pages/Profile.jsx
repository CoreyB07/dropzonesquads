import React, { useEffect, useState } from 'react';
import { Shield, ExternalLink, Monitor } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Profile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { success, error: showError } = useToast();
    const { user, updateUserProfile, loading } = useAuth();
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        username: '',
        activisionId: '',
        platform: 'Crossplay'
    });
    const isProfileSetupMode = new URLSearchParams(location.search).get('setup') === '1';

    useEffect(() => {
        setProfileForm({
            username: user?.username || '',
            activisionId: user?.activisionId || '',
            platform: user?.platform || 'Crossplay'
        });
    }, [user?.username, user?.activisionId, user?.platform]);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if ((profileForm.activisionId || '').trim().length === 0) {
            showError('Activision ID is required before you can join squads.');
            return;
        }

        setIsSavingProfile(true);
        const result = await updateUserProfile({
            username: profileForm.username,
            activisionId: profileForm.activisionId,
            platform: profileForm.platform
        });

        if (result.success) {
            success('Profile updated. You can now submit join requests.');
            setIsEditingProfile(false);
        } else {
            showError(result.message || 'Unable to update profile.');
        }
        setIsSavingProfile(false);
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
                    <button onClick={() => navigate('/auth')} className="btn-tactical w-full">
                        Sign In / Create Free Account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20 text-white">
            {isProfileSetupMode && (
                <div className="card-tactical border border-tactical-yellow/40 bg-tactical-yellow/5">
                    <p className="text-xs font-black uppercase tracking-widest text-tactical-yellow">
                        Complete your profile to join squads
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                        Add your Activision ID so it can be shared only after your request is accepted.
                    </p>
                </div>
            )}

            <div className="card-tactical">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Deployment Details</h2>
                    <button
                        onClick={() => setIsEditingProfile((prev) => !prev)}
                        className="text-xs font-bold uppercase text-tactical-yellow hover:underline flex items-center gap-1"
                    >
                        {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'} <ExternalLink className="w-3 h-3" />
                    </button>
                </div>

                {isEditingProfile ? (
                    <form onSubmit={handleProfileSave} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={profileForm.username}
                                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                    className="w-full bg-charcoal-dark border border-military-gray p-4 rounded-lg font-mono font-bold text-white outline-none focus:border-tactical-yellow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Activision ID</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="User#1234567"
                                    value={profileForm.activisionId}
                                    onChange={(e) => setProfileForm({ ...profileForm, activisionId: e.target.value })}
                                    className="w-full bg-charcoal-dark border border-military-gray p-4 rounded-lg font-mono font-bold text-white outline-none focus:border-tactical-yellow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Combat Platform</label>
                                <select
                                    value={profileForm.platform}
                                    onChange={(e) => setProfileForm({ ...profileForm, platform: e.target.value })}
                                    className="w-full bg-charcoal-dark border border-military-gray p-4 rounded-lg font-mono font-bold text-white uppercase outline-none focus:border-tactical-yellow"
                                >
                                    <option>PC</option>
                                    <option>PlayStation</option>
                                    <option>Xbox</option>
                                    <option>Crossplay</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Email Address</label>
                                <div className="bg-charcoal-dark border border-military-gray p-4 rounded-lg font-mono font-bold text-gray-400">
                                    {user?.email || 'N/A'}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="btn-tactical px-6 disabled:opacity-60"
                            >
                                {isSavingProfile ? 'Saving...' : 'Save Profile'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditingProfile(false)}
                                className="px-6 py-2 rounded-md border border-military-gray text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Activision ID</label>
                            <div className="bg-charcoal-dark border border-military-gray p-4 rounded-lg font-mono font-bold text-white">
                                <span>{user?.activisionId || 'NOT_CONNECTED#0000000'}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider ml-1">
                                Private. Shared only after accepted requests.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Email Address</label>
                            <div className="bg-charcoal-dark border border-military-gray p-4 rounded-lg font-mono font-bold text-gray-400">
                                {user?.email || 'N/A'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Combat Platform</label>
                            <div className="bg-charcoal-dark border border-military-gray p-4 rounded-lg font-mono font-bold text-tactical-yellow uppercase flex items-center gap-2">
                                <Monitor className="w-4 h-4" /> {user?.platform || 'Crossplay'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Account Status</label>
                            <div className="bg-charcoal-dark border border-military-gray p-4 rounded-lg font-mono font-bold text-green-500 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Verified Operative
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
