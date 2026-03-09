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

const normalizeProfile = (authUser, profile) => ({
    id: authUser.id,
    email: authUser.email || profile?.email || '',
    username: (profile?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'Operator').trim(),
    platform: (profile?.platform || authUser.user_metadata?.platform || 'Crossplay').trim(),
    activisionId: (profile?.activision_id || authUser.user_metadata?.activision_id || '').trim(),
    marketingOptIn: Boolean(profile?.marketing_opt_in ?? authUser.user_metadata?.marketing_opt_in),
    marketingOptInAt: profile?.marketing_opt_in_at || null,
    supporter: Boolean(profile?.supporter),
    isAdmin: Boolean(profile?.is_admin),
    avatar_url: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email || authUser.id}`
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [applications, setApplications] = useState(() => readStoredValue('warzone_hub_apps', []));
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
        const fallbackPlatform = (authUser.user_metadata?.platform || 'Crossplay').trim();
        const fallbackActivisionId = (authUser.user_metadata?.activision_id || '').trim();
        const fallbackMarketingOptIn = Boolean(authUser.user_metadata?.marketing_opt_in);

        const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .upsert({
                id: authUser.id,
                email: authUser.email || '',
                username: fallbackUsername || 'Operator',
                platform: fallbackPlatform || 'Crossplay',
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
            return;
        }

        try {
            const profile = await fetchProfile(authUser);
            const normalized = normalizeProfile(authUser, profile);
            setUser(normalized);
            localStorage.setItem('warzone_hub_current_user', JSON.stringify(normalized));
        } catch (error) {
            console.error('Failed to hydrate user profile:', error);
            const fallback = normalizeProfile(authUser, null);
            setUser(fallback);
            localStorage.setItem('warzone_hub_current_user', JSON.stringify(fallback));
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
                await hydrateUser(data.session?.user || null);
            } catch (error) {
                console.error('Failed to initialize auth session:', error);
                if (active) {
                    setUser(null);
                }
            } finally {
                if (active) {
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
            await hydrateUser(session?.user || null);
            if (active) {
                setLoading(false);
            }
        });

        return () => {
            active = false;
            subscription?.unsubscribe();
        };
    }, [hydrateUser, isSupabaseReady]);

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

            await hydrateUser(data.user || null);
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, message: 'Unable to sign in right now.' };
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

    const register = useCallback(async (userData) => {
        const normalizedEmail = (userData.email || '').trim().toLowerCase();
        const normalizedUsername = (userData.username || '').trim();
        const normalizedPassword = userData.password || '';
        const wantsMarketingOptIn = Boolean(userData.marketingOptIn);

        if (!normalizedUsername) {
            return { success: false, message: 'Username is required' };
        }

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
                password: normalizedPassword,
                options: {
                    data: {
                        username: normalizedUsername,
                        platform: userData.platform || 'Crossplay',
                        activision_id: (userData.activisionId || '').trim(),
                        marketing_opt_in: wantsMarketingOptIn
                    }
                }
            });

            if (error) {
                return { success: false, message: error.message || 'Unable to create account.' };
            }

            if (data.user) {
                try {
                    await supabase
                        .from('profiles')
                        .upsert({
                            id: data.user.id,
                            email: normalizedEmail,
                            username: normalizedUsername,
                            platform: userData.platform || 'Crossplay',
                            activision_id: (userData.activisionId || '').trim(),
                            marketing_opt_in: wantsMarketingOptIn,
                            marketing_opt_in_at: wantsMarketingOptIn ? new Date().toISOString() : null
                        });
                } catch (profileError) {
                    console.error('Profile upsert after sign-up failed:', profileError);
                }

                if (wantsMarketingOptIn) {
                    await captureMarketingSubscriber({
                        userId: data.user.id,
                        email: normalizedEmail,
                        username: normalizedUsername
                    });
                }
            }

            if (!data.session) {
                return {
                    success: true,
                    requiresEmailConfirmation: true,
                    message: 'Account created. Check your email to confirm, then sign in.'
                };
            }

            await hydrateUser(data.session.user || data.user || null);
            return { success: true };
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, message: 'Unable to create account right now.' };
        }
    }, [captureMarketingSubscriber, hydrateUser, isSupabaseReady]);

    const updateApplicationStatus = (appId, newStatus, metadata = {}) => {
        const updated = applications.map(app =>
            app.id === appId
                ? {
                    ...app,
                    status: newStatus,
                    respondedAt: new Date().toISOString(),
                    respondedByUserId: user?.id || null,
                    ...metadata
                }
                : app
        );
        setApplications(updated);
        localStorage.setItem('warzone_hub_apps', JSON.stringify(updated));
    };

    const logout = async () => {
        if (!isSupabaseReady) {
            setUser(null);
            localStorage.removeItem('warzone_hub_current_user');
            return;
        }

        try {
            assertSupabaseConfigured();
            await supabase.auth.signOut();
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
        const nextPlatform = (profileData.platform || '').trim() || 'Crossplay';
        const nextActivisionId = (profileData.activisionId || '').trim();

        if (!nextUsername) {
            return { success: false, message: 'Username is required.' };
        }

        if (!isSupabaseReady) {
            const updatedUser = {
                ...user,
                username: nextUsername,
                platform: nextPlatform,
                activisionId: nextActivisionId
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
                    activision_id: nextActivisionId
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
                        activision_id: nextActivisionId
                    }
                },
                data
            );
            setUser(updatedUser);
            localStorage.setItem('warzone_hub_current_user', JSON.stringify(updatedUser));
            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Profile update failed:', error);
            return { success: false, message: 'Unable to update profile right now.' };
        }
    };

    const applyToSquad = (squadId, applicationData) => {
        const payload = {
            id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            squadId,
            ...applicationData,
            status: applicationData.status || 'pending',
            date: new Date().toISOString()
        };
        const newApps = [...applications, payload];
        setApplications(newApps);
        localStorage.setItem('warzone_hub_apps', JSON.stringify(newApps));
        return payload;
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            updateUserProfile,
            loading,
            applications,
            applyToSquad,
            updateApplicationStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
