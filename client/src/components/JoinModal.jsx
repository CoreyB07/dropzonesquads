import React from 'react';
import { X, Check, MessageSquare, Shield } from 'lucide-react';

const JoinModal = ({ squad, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-charcoal-light border-2 border-military-gray rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-military-gray/30 p-6 flex justify-between items-center border-b border-military-gray">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Join {squad.name}</h2>
                        <p className="text-xs font-bold text-tactical-yellow uppercase tracking-widest">{squad.gameMode}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-military-gray/10 p-4 rounded-xl border border-military-gray/30">
                        <h4 className="text-[10px] font-black uppercase text-gray-500 mb-2">Privacy Notice</h4>
                        <p className="text-sm text-gray-300 leading-relaxed italic">
                            Activision IDs are only shared after a leader accepts your application.
                        </p>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3 text-green-400">
                        <Check className="w-5 h-5" />
                        <p className="text-xs font-bold uppercase tracking-wide">Application status: Pending review</p>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-xl border border-white/10 transition-all uppercase text-sm flex items-center justify-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Message
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-tactical-yellow text-charcoal-dark font-black py-4 rounded-xl hover:bg-yellow-500 transition-all uppercase text-sm"
                        >
                            Done
                        </button>
                    </div>
                </div>

                <div className="bg-tactical-yellow/5 p-4 border-t border-tactical-yellow/10 text-center flex items-center justify-center gap-2">
                    <Shield className="w-3 h-3 text-tactical-yellow/70" />
                    <p className="text-[10px] font-bold text-tactical-yellow/60 uppercase tracking-tighter">
                        Drop Zone Squads protects private player IDs.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JoinModal;
