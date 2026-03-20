import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserRound, KeyRound, Users, MessageSquare, ArrowRight } from 'lucide-react';

const PrivacyInfo = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-tactical-yellow">Privacy Intel</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">How Activision ID Sharing Works</h1>
                <p className="text-sm sm:text-base text-gray-400">Quick breakdown of what you need to start, what stays optional, and how your sharing controls work.</p>
            </div>

            <section className="card-tactical space-y-4">
                <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-tactical-yellow" /> What You Need To Use Drop Zone Squads</h2>
                <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-tactical-yellow" /> You can sign up, join squads, add friends, and message with no Activision ID.</li>
                    <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-tactical-yellow" /> Username + platform are enough to deploy.</li>
                    <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-tactical-yellow" /> Add Activision ID later from Profile whenever you want faster squad coordination.</li>
                </ul>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <article className="card-tactical space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2"><KeyRound className="w-4 h-4 text-tactical-yellow" /> Activision ID (Optional)</h3>
                    <p className="text-sm text-gray-300">Adding your Activision ID can make squad coordination faster, but it is never required to use the core features.</p>
                </article>
                <article className="card-tactical space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2"><UserRound className="w-4 h-4 text-tactical-yellow" /> Profile Privacy Controls</h3>
                    <p className="text-sm text-gray-300">In Profile settings, you can control if your Activision ID is shared with accepted friends and/or squad members.</p>
                </article>
                <article className="card-tactical space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2"><Users className="w-4 h-4 text-tactical-yellow" /> Friend + Squad Flows</h3>
                    <p className="text-sm text-gray-300">You can still find players, send requests, and join squads without an Activision ID on file.</p>
                </article>
                <article className="card-tactical space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-tactical-yellow" /> Messaging</h3>
                    <p className="text-sm text-gray-300">Direct messages and squad chat do not require an Activision ID.</p>
                </article>
            </section>

            <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/profile" className="btn-tactical text-center">Manage Profile</Link>
                <Link to="/find" className="px-6 py-3 rounded-lg border border-military-gray bg-charcoal-dark text-sm font-black uppercase tracking-widest text-gray-300 hover:text-white hover:border-gray-400 transition-all text-center">Find a Squad</Link>
            </div>
        </div>
    );
};

export default PrivacyInfo;
