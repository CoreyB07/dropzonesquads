import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { Shield, Mail, User, Lock, Monitor, Smartphone, Layout } from 'lucide-react';

const Auth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();
    const { success, error: showError } = useToast();
    const isLogin = new URLSearchParams(location.search).get('mode') !== 'signup';
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        activisionId: '',
        platform: 'Crossplay',
        marketingOptIn: false
    });

    const setAuthMode = (nextIsLogin) => {
        const params = new URLSearchParams(location.search);
        if (nextIsLogin) {
            params.delete('mode');
        } else {
            params.set('mode', 'signup');
        }

        const search = params.toString();
        navigate(
            {
                pathname: location.pathname,
                search: search ? `?${search}` : ''
            },
            { replace: true }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = isLogin
            ? await login(formData.email, formData.password)
            : await register(formData);

        if (result.success) {
            if (result.requiresEmailConfirmation) {
                success(result.message || 'Account created. Please confirm your email before signing in.');
                setAuthMode(true);
            } else {
                success(isLogin ? 'Signed in successfully.' : 'Account created. You are now signed in.');
                setTimeout(() => navigate('/'), 900);
            }
        } else {
            showError(result.message || 'Authentication failed');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-tactical-yellow/10 border border-tactical-yellow/20 mb-4">
                        <Shield className="w-8 h-8 text-tactical-yellow" />
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </h1>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
                        {isLogin
                            ? 'Free membership sign in with email + password'
                            : 'Free account setup. Activision ID is optional now and can be added later.'}
                    </p>
                </div>

                <div className="card-tactical border-t-4 border-t-tactical-yellow p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        required
                                        type="email"
                                        placeholder="ghost@ops.com"
                                        className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 pl-10 pr-4 text-sm focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-700"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 pl-10 pr-4 text-sm focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-700"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            {!isLogin && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                required
                                                type="text"
                                                placeholder="GhostOperator"
                                                className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 pl-10 pr-4 text-sm focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-700"
                                                value={formData.username}
                                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Activision ID (Optional at Sign Up)</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Ghost#1234567"
                                                className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 pl-10 pr-4 text-sm focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-700"
                                                value={formData.activisionId}
                                                onChange={e => setFormData({ ...formData, activisionId: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-wide">
                                            You can sign up without this. Required before submitting join requests.
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Combat Platform</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { id: 'PC', icon: Monitor },
                                                { id: 'PlayStation', icon: Layout },
                                                { id: 'Xbox', icon: Smartphone },
                                                { id: 'Crossplay', icon: Shield }
                                            ].map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, platform: p.id })}
                                                    className={`py-2 px-3 rounded border flex flex-col items-center gap-1 transition-all ${formData.platform === p.id
                                                        ? 'bg-tactical-yellow/10 border-tactical-yellow text-tactical-yellow'
                                                        : 'bg-charcoal-dark border-military-gray text-gray-500 hover:border-gray-400'
                                                        }`}
                                                >
                                                    <p.icon className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase">{p.id === 'PlayStation' ? 'PS' : p.id === 'Crossplay' ? 'Any' : p.id}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <label className="flex items-start gap-3 rounded-lg border border-military-gray bg-charcoal-dark/60 px-3 py-3">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(formData.marketingOptIn)}
                                            onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })}
                                            className="mt-0.5 h-4 w-4 accent-tactical-yellow"
                                        />
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-relaxed">
                                            I agree to receive updates and special offers from Drop Zone Squads.
                                        </span>
                                    </label>
                                </>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-charcoal-dark font-black py-4 rounded-xl uppercase italic hover:bg-tactical-yellow transition-all flex items-center justify-center gap-2 group shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-pulse">Authenticating...</span>
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <Shield className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-military-gray/30 text-center">
                        <button
                            onClick={() => {
                                setAuthMode(!isLogin);
                            }}
                            className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-tactical-yellow transition-colors"
                        >
                            {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Auth;
