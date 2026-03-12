import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { Shield, Mail, Lock, MessageSquare } from 'lucide-react';

const Auth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, signInWithOAuth } = useAuth();
    const { success, error: showError } = useToast();
    const isLogin = new URLSearchParams(location.search).get('mode') !== 'signup';
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
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
                setTimeout(() => navigate(isLogin ? '/' : '/onboarding'), 900);
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
                            : 'Step 1: Secure your connection. Profile setup follows.'}
                    </p>
                </div>

                <div className="card-tactical border-t-4 border-t-tactical-yellow p-8">
                    <div className="space-y-3 mb-6">
                        <button
                            type="button"
                            onClick={async () => {
                                const result = await signInWithOAuth('discord');
                                if (!result?.success) {
                                    showError(result?.message || 'Discord sign-in is unavailable right now.');
                                }
                            }}
                            disabled={loading}
                            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-black uppercase tracking-wide py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-lg"
                        >
                            <MessageSquare className="w-5 h-5" />
                            Continue with Discord
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                const result = await signInWithOAuth('google');
                                if (!result?.success) {
                                    showError(result?.message || 'Google sign-in is unavailable right now.');
                                }
                            }}
                            disabled={loading}
                            className="w-full bg-white hover:bg-gray-100 text-charcoal-dark font-black uppercase tracking-wide py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-lg"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    <div className="relative flex items-center py-2 mb-6">
                        <div className="flex-grow border-t border-military-gray"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-[10px] font-black uppercase tracking-widest">Or continue with email</span>
                        <div className="flex-grow border-t border-military-gray"></div>
                    </div>

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
                                        className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 pl-10 pr-4 text-sm text-white caret-white focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-700"
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
                                        className="w-full bg-charcoal-dark border border-military-gray rounded-lg py-3 pl-10 pr-4 text-sm text-white caret-white focus:border-tactical-yellow outline-none transition-all placeholder:text-gray-700"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-charcoal-dark font-black py-4 rounded-xl uppercase italic hover:bg-[#fff5dc] transition-all flex items-center justify-center gap-2 group shadow-xl active:scale-95 disabled:opacity-50"
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
                            className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-tactical-yellow-hover transition-colors"
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
