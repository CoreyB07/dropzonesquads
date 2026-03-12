import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // OAuth users should always land on Home first to avoid route dead-ends,
                // then they can finish profile setup from the profile/onboarding paths.
                navigate('/', { replace: true });
            } else {
                // If there's no user after loading finishes, the OAuth failed or session is invalid
                navigate('/auth', { replace: true });
            }
        }
    }, [user, loading, navigate]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="text-center space-y-4 animate-pulse">
                <Shield className="w-16 h-16 text-tactical-yellow mx-auto animate-bounce" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                    Verifying Credentials...
                </h2>
                <p className="text-gray-500 uppercase tracking-widest text-xs">
                    Establishing secure connection to Drop Zone Squads HQ
                </p>
            </div>
        </div>
    );
};

export default AuthCallback;
