/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { assertSupabaseConfigured, supabase } from '../utils/supabase';

const AuthContext = createContext();
const MARKETING_CONSENT_TEXT = 'I agree to receive updates and special offers from Drop Zone Squads.';

const readStoredValue = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.error(`Failed to parse ${key}:`, error);
        return fallback;
    }
};

const hasCompletedOnboarding = ({ username = '', platform = '', activisionId = '' }) => {
    const normalizedUsername = String(username || '').trim();
    const normalizedPlatform = String(platform || '').trim();
    const normalizedActivision = String(activisionId || '').trim();

    const validPlatform = ['PC', 'Xbox', 'PlayStation'].includes(normalizedPlatform);
    const validUsername = normalizedUsername.length > 0 && normalizedUsername !== '__pending__';

    return validUsername && validPlatform && normalizedActivision.length > 0;
};

const normalizeProfile = (authUser, profile) => {
    const rawUsername = (profile?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || '').trim();
    const platform = (profile?.platform || authUser.user_metadata?.platform || 'Crossplay').trim();
    const activisionId = (profile?.activision_id || authUser.user_metadata?.activision_id || '').trim();

    return {
        id: authUser.id,
        email: authUser.email || profile?.email || '',
        username: rawUsername,
        platform,
        activisionId,
        shareActivisionIdWithFriends: Boolean(profile?.share_activision_id_with_friends ?? authUser.user_metadata?.share_activision_id_with_friends),
        shareActivisionIdWithSquads: Boolean(profile?.share_activision_id_with_squads ?? authUser.user_metadata?.share_activision_id_with_squads),
        marketingOptIn: Boolean(profile?.marketing_opt_in ?? authUser.user_metadata?.marketing_opt_in),
        marketingOptInAt: profile?.marketing_opt_in_at || null,
        onboardingComplete: hasCompletedOnboarding({ username: rawUsername, platform, activisionId }),
        isSupporter: Boolean(profile?.is_supporter || profile?.supporter),
        isAdmin: Boolean(profile?.is_admin),
        avatar_url: profile?.avatar_url || null
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const isSupabaseReady = Boolean(supabase);

    const fetchProfile = useCallback(async (authUser) => {
        assertSupabaseConfigured();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            return data;
        }

        const fallbackUsername = (authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'Operator').trim();
        const fallbackPlatform = (authUser.user_metadata?.platform || 'PC').trim();
        const fallbackActivisionId = (authUser.user_metadata?.activision_id || '').trim();
        const fallbackMarketingOptIn = Boolean(authUser.user_metadata?.marketing_opt_in);

        const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .upsert({
                id: authUser.id,
                email: authUser.email || '',
                username: fallbackUsername || 'Operator',
                platform: fallbackPlatform || 'PC',
                activision_id: fallbackActivisionId,
                marketing_opt_in: fallbackMarketingOptIn,
                marketing_opt_in_at: fallbackMarketingOptIn ? new Date().toISOString() : null
            })
            .select('*')
            .single();

        if (insertError) {
            throw insertError;
        }

        return inserted;
    }, []);

    const hydrateUser = useCallback(async (authUser) => {
        if (!authUser) {
            setUser(null);
            localStorage.removeItem('warzone_hub_current_user');
            return null;
        }

        // Optimistic user state first so UI doesn't get stuck waiting on profile fetch/upsert.
        const optimistic = normalizeProfile(authUser, null);
        setUser(optimistic);
        localStorage.setItem('warzone_hub_current_user', JSON.stringify(optimistic));

        try {
            const profile = await fetchProfile(authUser);
            const normalized = normalizeProfile(authUser, profile);
            setUser(normalized);
            localStorage.setItem('warzone_hub_current_user', JSON.stringify(normalized));
            return normalized;
        } catch (error) {
            console.error('Failed to hydrate user profile:', error);
            return optimistic;
        }
    }, [fetchProfile]);

    useEffect(() => {
        let active = true;

        const init = async () => {
            if (!isSupabaseReady) {
                setUser(readStoredValue('warzone_hub_current_user', null));
                setLoading(false);
                return;
            }

            try {
                assertSupabaseConfigured();
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    throw error;
                }
                if (!active) return;

                // Never block initial render on profile hydration.
                setLoading(false);
                const authUser = data.session?.user || null;
                if (!authUser) {
                    setUser(null);
                    localStorage.removeItem('warzone_hub_current_user');
                    return;
                }

                await hydrateUser(authUser);
            } catch (error) {
                console.error('Failed to initialize auth session:', error);
                if (active) {
                    setUser(null);
                    setLoading(false);
                }
            }
        };

        init();

        if (!isSupabaseReady) {
            return () => {
                active = false;
            };
        }

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!active) return;
            setLoading(false);
            await hydrateUser(session?.user || null);
        });

        return () => {
            active = false;
            subscription?.unsubscribe();
        };
    }, [hydrateUser, isSupabaseReady]);

    useEffect(() => {
        if (!user || !isSupabaseReady) {
            setApplications([]);
            return;
        }

        const fetchApplications = async () => {
            try {
                assertSupabaseConfigured();
                // RLS automatically filters this to only sent or received applications
                const { data, error } = await supabase
                    .from('squad_applications')
                    .select(`
                        id, squad_id, applicant_id, role, discord, status, created_at,
                        squad:squad_id(name, creator_id),
                        applicant:profiles!squad_applications_applicant_id_fkey(username, platform)
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const mappedApps = data.map(app => ({
                        id: app.id,
                        squadId: app.squad_id,
                        applicantUserId: app.applicant_id,
                        applicantUsername: app.applicant?.username || 'Unknown',
                        applicantPlatform: app.applicant?.platform || 'PC',
                        squadName: app.squad?.name || 'Unknown Squad',
                        squadCreatorUserId: app.squad?.creator_id,
                        role: app.role,
                        discord: app.discord,
                        status: app.status,
                        date: app.created_at
                    }));
                    setApplications(mappedApps);
                }
            } catch (err) {
                console.error('Failed to fetch applications:', err);
            }
        };

        fetchApplications();
    }, [user, isSupabaseReady]);

    const login = async (email, password) => {
        const normalizedEmail = (email || '').trim().toLowerCase();
        if (!isSupabaseReady) {
            return { success: false, message: 'Supabase is not configured yet.' };
        }

        try {
            assertSupabaseConfigured();
            const { data, error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password
            });

            if (error) {
                return { success: false, message: error.message || 'Invalid credentials.' };
            }

            const hydrated = await hydrateUser(data.user || null);
            return { success: true, onboardingComplete: Boolean(hydrated?.onboardingComplete) };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, message: 'Unable to sign in right now.' };
        }
    };

    const signInWithOAuth = async (provider) => {
        if (!isSupabaseReady) {
            return { success: false, message: 'Supabase is not configured yet.' };
        }

        try {
            assertSupabaseConfigured();
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`${provider} OAuth login failed:`, error);
            return { success: false, message: `Unable to sign in with ${provider} right now.` };
        }
    };


    const captureMarketingSubscriber = useCallback(async ({ userId, email, username }) => {
        if (!isSupabaseReady) {
            return;
        }

        const normalizedEmail = (email || '').trim().toLowerCase();
        if (!normalizedEmail) {
            return;
        }

        try {
            assertSupabaseConfigured();
            const { error } = await supabase
                .from('marketing_subscribers')
                .insert({
                    user_id: userId || null,
                    email: normalizedEmail,
                    username: (username || '').trim() || null,
                    source: 'signup_form',
                    consent_text: MARKETING_CONSENT_TEXT,
                    consented_at: new Date().toISOString(),
                    subscribed: true
                });

            if (error && error.code !== '23505') {
                console.error('Failed to capture marketing subscriber:', error);
            }
        } catch (error) {
            console.error('Failed to capture marketing subscriber:', error);
        }
    }, [isSupabaseReady]);

    const register = useCallback(async ({ email, password }) => {
        const normalizedEmail = (email || '').trim().toLowerCase();
        const normalizedPassword = password || '';

        if (normalizedPassword.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        if (!isSupabaseReady) {
            return { success: false, message: 'Supabase is not configured yet.' };
        }

        try {
            assertSupabaseConfigured();
            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: normalizedPassword
            });

            if (error) {
                return { success: false, message: error.message || 'Unable to create account.' };
            }

            if (data.user) {
                // Initialize a bare-bones profile. The rest will be filled in Onboarding.jsx
                try {
                    await supabase
                        .from('profiles')
                        .upsert({
                            id: data.user.id,
                            email: normalizedEmail,
                            username: '__pending__',
                            platform: 'Crossplay',
                            activision_id: '',
                            marketing_opt_in: false,
                            marketing_opt_in_at: null
                        });
                } catch (profileError) {
                    console.error('Profile upsert after sign-up failed:', profileError);
                }
            }

            if (!data.session) {
                return {
                    success: true,
                    requiresEmailConfirmation: true,
                    message: 'Account created. Check your email to confirm, then sign in.'
                };
            }

            const hydrated = await hydrateUser(data.session.user || data.user || null);
            return { success: true, onboardingComplete: Boolean(hydrated?.onboardingComplete) };
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, message: 'Unable to create account right now.' };
        }
    }, [captureMarketingSubscriber, hydrateUser, isSupabaseReady]);



    const logout = async () => {
        if (!isSupabaseReady) {
            setUser(null);
            localStorage.removeItem('warzone_hub_current_user');
            return;
        }

        try {
            assertSupabaseConfigured();
            await Promise.race([
                supabase.auth.signOut(),
                new Promise((resolve) => setTimeout(resolve, 3000))
            ]);
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('warzone_hub_current_user');
        }
    };

    const updateUserProfile = async (profileData) => {
        if (!user?.id) {
            return { success: false, message: 'You must be signed in to update profile.' };
        }

        const nextUsername = (profileData.username || '').trim();
        const nextPlatform = (profileData.platform || '').trim() || 'PC';
        const nextActivisionId = (profileData.activisionId || '').trim();
        const nextShareWithFriends = profileData.shareActivisionIdWithFriends !== undefined
            ? Boolean(profileData.shareActivisionIdWithFriends)
            : Boolean(user.shareActivisionIdWithFriends);
        const nextShareWithSquads = profileData.shareActivisionIdWithSquads !== undefined
            ? Boolean(profileData.shareActivisionIdWithSquads)
            : Boolean(user.shareActivisionIdWithSquads);
        let nextMarketingOptIn = user.marketingOptIn;
        let nextMarketingOptInAt = user.marketingOptInAt;

        if (profileData.marketingOptIn !== undefined) {
            nextMarketingOptIn = Boolean(profileData.marketingOptIn);
            if (profileData.marketingOptInAt) {
                nextMarketingOptInAt = profileData.marketingOptInAt;
            }
        }

        if (!nextUsername) {
            return { success: false, message: 'Username is required.' };
        }

        if (!isSupabaseReady) {
            const updatedUser = {
                ...user,
                username: nextUsername,
                platform: nextPlatform,
                activisionId: nextActivisionId,
                shareActivisionIdWithFriends: nextShareWithFriends,
                shareActivisionIdWithSquads: nextShareWithSquads,
                marketingOptIn: nextMarketingOptIn,
                marketingOptInAt: nextMarketingOptInAt
            };
            localStorage.setItem('warzone_hub_current_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return { success: true, user: updatedUser };
        }

        try {
            assertSupabaseConfigured();
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    username: nextUsername,
                    platform: nextPlatform,
                    activision_id: nextActivisionId,
                    share_activision_id_with_friends: nextShareWithFriends,
                    share_activision_id_with_squads: nextShareWithSquads,
                    marketing_opt_in: nextMarketingOptIn,
                    marketing_opt_in_at: nextMarketingOptInAt
                })
                .eq('id', user.id)
                .select('*')
                .single();

            if (error) {
                return { success: false, message: error.message || 'Unable to update profile.' };
            }

            const updatedUser = normalizeProfile(
                {
                    id: user.id,
                    email: user.email,
                    user_metadata: {
                        username: nextUsername,
                        platform: nextPlatform,
                        activision_id: nextActivisionId,
                        share_activision_id_with_friends: nextShareWithFriends,
                    share_activision_id_with_squads: nextShareWithSquads,
                        marketing_opt_in: nextMarketingOptIn,
                        marketing_opt_in_at: nextMarketingOptInAt
                    }
                },
                data
            );
            setUser(updatedUser);
            localStorage.setItem('warzone_hub_current_user', JSON.stringify(updatedUser));

            if (nextMarketingOptIn && marketingOptInAt && !user.marketingOptInAt) {
                // They just opted in for the first time during this update
                await captureMarketingSubscriber({
                    userId: user.id,
                    email: user.email,
                    username: nextUsername
                });
            }

            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Profile update failed:', error);
            return { success: false, message: 'Unable to update profile right now.' };
        }
    };

    const updateApplicationStatus = async (appId, newStatus) => {
        if (!isSupabaseReady) return;
        try {
            assertSupabaseConfigured();
            const { error } = await supabase
                .from('squad_applications')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', appId);

            if (error) throw error;

            const updated = applications.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            );
            setApplications(updated);

            const changed = updated.find(app => app.id === appId);
            if (changed) {
                try {
                    if (newStatus === 'accepted' || newStatus === 'rejected') {
                        await supabase.from('notifications').insert({
                            recipient_id: changed.applicantUserId,
                            actor_id: user?.id || null,
                            type: `squad_join_request_${newStatus}`,
                            payload: { squad_id: changed.squadId, squad_name: changed.squadName }
                        });
                    }
                } catch (notifErr) {
                    console.warn('Failed to send squad application status notification:', notifErr);
                }
            }
        } catch (err) {
            console.error('Failed to update application status:', err);
        }
    };

    const applyToSquad = async (squadId, applicationData) => {
        if (!isSupabaseReady || !user) return;
        try {
            assertSupabaseConfigured();
            const { data, error } = await supabase
                .from('squad_applications')
                .insert({
                    squad_id: squadId,
                    applicant_id: user.id,
                    role: applicationData.role || 'Slayer',
                    discord: applicationData.discord || '',
                    status: 'pending'
                })
                .select(`
                    id, squad_id, applicant_id, role, discord, status, created_at,
                    squad:squad_id(name, creator_id),
                    applicant:profiles!squad_applications_applicant_id_fkey(username, platform)
                `)
                .single();

            if (error) {
                if (error.code === '23505') {
                    console.warn('Application already exists');
                    return null;
                }
                throw error;
            }

            if (data) {
                const mappedApp = {
                    id: data.id,
                    squadId: data.squad_id,
                    applicantUserId: data.applicant_id,
                    applicantUsername: data.applicant?.username || user.username,
                    applicantPlatform: data.applicant?.platform || user.platform,
                    squadName: data.squad?.name || applicationData.squadName,
                    squadCreatorUserId: data.squad?.creator_id || applicationData.squadCreatorUserId,
                    role: data.role,
                    discord: data.discord,
                    status: data.status,
                    date: data.created_at
                };
                setApplications(prev => [mappedApp, ...prev]);
                try {
                    if (mappedApp.squadCreatorUserId) {
                        await supabase.from('notifications').insert({
                            recipient_id: mappedApp.squadCreatorUserId,
                            actor_id: user.id,
                            type: 'squad_join_request',
                            payload: { squad_id: mappedApp.squadId, squad_name: mappedApp.squadName, applicant_id: user.id }
                        });
                    }
                } catch (notifErr) {
                    console.warn('Failed to send squad join request notification:', notifErr);
                }
                return mappedApp;
            }
        } catch (err) {
            console.error('Failed to apply to squad:', err);
            throw err;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            signInWithOAuth,
            logout,
            updateUserProfile,
            loading,
            applications,
            applyToSquad,
            updateApplicationStatus,
            isSupabaseReady
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
