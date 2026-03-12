import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Shield, Target, MessageSquare, Lock, UserCheck, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import SquadNameText from './SquadNameText';

const ApplyModal = ({ squad, onClose }) => {
    const navigate = useNavigate();
    const { user, loading, applyToSquad, applications } = useAuth();
    const { success, error: showError } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasApplied = user
        ? applications.some(app =>
            app.squadId === squad.id &&
            app.applicantUserId === user.id &&
            ['pending', 'accepted'].includes(app.status)
        )
        : false;

    const isOwnSquad = user?.id && squad?.creatorId && user.id === squad.creatorId;
    const isProfileReady = (user?.activisionId || '').trim().length > 0;

    const [formData, setFormData] = useState({
        discord: '',
        role: 'Slayer'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            return;
        }
        if ((user.activisionId || '').trim().length === 0) {
            showError('Add your Activision ID in your profile before applying.');
            return;
        }

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1200));

        applyToSquad(squad.id, {
            ...formData,
            applicantUserId: user.id,
            applicantUsername: user.username,
            applicantEmail: user.email,
            applicantPlatform: user.platform || '',
            squadName: squad.name,
            squadCreatorUserId: squad.creatorId || null,
            status: 'pending'
        });

        setIsSubmitting(false);
        success('Deployment request sent. Awaiting command approval.');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-dark/95 backdrop-blur-md overflow-y-auto">
            <div className="card-tactical max-w-lg w-full relative border-t-4 border-t-tactical-yellow animate-in slide-in-from-bottom-4 duration-300 my-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-military-gray/20 rounded-full transition-colors text-gray-500 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="space-y-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-tactical-yellow font-black text-xs uppercase tracking-widest">
                            <Shield className="w-3 h-3" /> Recruitment Intake
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Join <SquadNameText name={squad.name} restClassName="text-white" /></h2>
                        <p className="text-gray-400 text-sm">Browsing is open to everyone. Join requests and messages require a free member profile.</p>
                    </div>

                    {!user ? (
                        <div className="p-6 bg-military-gray/10 rounded-xl border border-dashed border-military-gray text-center space-y-4">
                            <Lock className="w-12 h-12 text-gray-600 mx-auto" />
                            <p className="font-bold text-gray-300 uppercase tracking-widest text-sm">Free Membership Required</p>
                            {loading ? (
                                <p className="text-xs text-gray-500">Checking your account...</p>
                            ) : (
                                <>
                                    <p className="text-xs text-gray-500">
                                        You can browse squads, profiles, and the full site without signing up. Sending join requests or direct messages requires a free membership.
                                    </p>
                                    <button
                                        onClick={() => navigate('/auth?mode=signup')}
                                        className="btn-tactical w-full"
                                    >
                                        Create Free Membership
                                    </button>
                                </>
                            )}
                        </div>
                    ) : !isProfileReady ? (
                        <div className="p-6 bg-military-gray/10 rounded-xl border border-dashed border-military-gray text-center space-y-4">
                            <UserCheck className="w-12 h-12 text-gray-600 mx-auto" />
                            <p className="font-bold text-gray-300 uppercase tracking-widest text-sm">Complete Member Profile</p>
                            <p className="text-xs text-gray-500">
                                Finish your member profile and add your Activision ID before sending join requests or messages.
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/profile?setup=1');
                                }}
                                className="btn-tactical w-full"
                            >
                                Complete Member Profile
                            </button>
                        </div>
                    ) : isOwnSquad ? (
                        <div className="p-6 bg-military-gray/10 rounded-xl border border-dashed border-military-gray text-center space-y-4">
                            <Target className="w-12 h-12 text-gray-600 mx-auto" />
                            <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">You Posted This Squad</p>
                            <button onClick={onClose} className="text-xs text-tactical-yellow hover:underline uppercase font-black">Close</button>
                        </div>
                    ) : hasApplied ? (
                        <div className="p-6 bg-military-gray/10 rounded-xl border border-dashed border-military-gray text-center space-y-4">
                            <Target className="w-12 h-12 text-gray-600 mx-auto" />
                            <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">Application Already Pending</p>
                            <button onClick={onClose} className="text-xs text-tactical-yellow hover:underline uppercase font-black">Continue Browsing</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="p-4 rounded-xl border border-tactical-yellow/30 bg-tactical-yellow/5 text-xs text-gray-300">
                                No website messaging required. Clan leader sees your Activision ID only after acceptance.
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gray-500">Primary Combat Role</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Slayer', 'Cap', 'Support'].map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role })}
                                            className={`py-2 px-3 rounded border text-[10px] font-black uppercase transition-all ${formData.role === role
                                                ? 'bg-tactical-yellow/10 border-tactical-yellow text-tactical-yellow shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                                : 'bg-charcoal-dark border-military-gray text-gray-500 hover:border-gray-400'
                                                }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gray-500">Discord (Optional)</label>
                                <input
                                    placeholder="ghost.ops"
                                    className="w-full bg-charcoal-dark border border-military-gray rounded p-3 text-sm text-white caret-white focus:border-tactical-yellow outline-none"
                                    value={formData.discord}
                                    onChange={e => setFormData({ ...formData, discord: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full font-black uppercase italic py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl ${isSubmitting
                                        ? 'bg-military-gray text-gray-500 cursor-not-allowed'
                                        : 'bg-white text-charcoal-dark hover:bg-[#fff5dc] active:scale-95'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>Processing Intake...</>
                                    ) : (
                                        <>
                                            Submit Deployment Request <MessageSquare className="w-4 h-4" />
                                        </>
                                    )}
                                </button>

                                {squad.creatorId && squad.creatorId !== user.id && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            navigate(`/dm/${squad.creatorId}`);
                                        }}
                                        className="w-full font-black uppercase text-xs tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 border border-military-gray bg-charcoal-dark text-gray-400 hover:text-tactical-yellow-hover hover:border-tactical-yellow-hover transition-all"
                                    >
                                        Direct Message Leader <Mail className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplyModal;
