import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabaseAuth } from '../utils/supabase';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const AuthCallback = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [recovering, setRecovering] = useState(true);
    const [error, setError] = useState('');

    const callbackCode = useMemo(() => new URLSearchParams(window.location.search).get('code'), []);

    useEffect(() => {
        let active = true;

        const recoverOAuthSession = async () => {
            if (!supabaseAuth) {
                if (active) {
                    setRecovering(false);
                    setError('Auth service is unavailable right now.');
                }
                return;
            }

            try {
                // Give Supabase client a moment to process URL hash/token in tough browser contexts.
                await sleep(200);

                if (callbackCode) {
                    await supabaseAuth.auth.exchangeCodeForSession(callbackCode);
                }

                // Retry a few times because some browser contexts are delayed after OAuth redirect.
                let recoveredUser = null;
                for (let i = 0; i < 6; i += 1) {
                    const { data } = await supabaseAuth.auth.getUser();
                    recoveredUser = data?.user || null;
                    if (recoveredUser) break;
                    await sleep(300);
                }

                if (!active) return;

                if (recoveredUser) {
                    // AuthContext listener will hydrate and navigate once user+loading settle.
                    setRecovering(false);
                    setError('');
                    return;
                }

                setRecovering(false);
                setError('OAuth sign-in did not complete in this browser session.');
            } catch (err) {
                if (!active) return;
                console.error('OAuth callback recovery failed:', err);
                setRecovering(false);
                setError(err?.message || 'OAuth callback failed.');
            }
        };

        recoverOAuthSession();

        return () => {
            active = false;
        };
    }, [callbackCode]);

    useEffect(() => {
        if (!loading && !recovering) {
            if (user) {
                const nextPath = user.onboardingComplete ? '/' : '/onboarding';
                navigate(nextPath, { replace: true });
            }
        }
    }, [user, loading, recovering, navigate]);

    const retry = () => {
        navigate('/auth?mode=login', { replace: true });
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-md">
                <Shield className="w-16 h-16 text-tactical-yellow mx-auto animate-bounce" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                    Verifying Credentials...
                </h2>
                <p className="text-gray-500 uppercase tracking-widest text-xs">
                    Establishing secure connection to Drop Zone Squads HQ
                </p>

                {error && (
                    <div className="mt-4 rounded-lg border border-red-500/35 bg-red-500/10 p-3">
                        <p className="text-xs font-bold text-red-300">{error}</p>
                        <button
                            type="button"
                            onClick={retry}
                            className="mt-3 inline-flex items-center gap-2 rounded-md border border-military-gray bg-charcoal-dark px-3 py-2 text-[11px] font-black uppercase tracking-wider text-white hover:border-tactical-yellow"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" /> Retry Sign In
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
