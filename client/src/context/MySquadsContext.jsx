import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserSquads } from '../utils/squadMembersApi';

const MySquadsContext = createContext({
    mySquads: [],
    loading: true,
    isMemberOf: () => false,
});

export const useMySquads = () => useContext(MySquadsContext);

export const MySquadsProvider = ({ children }) => {
    const { user, isSupabaseReady } = useAuth();
    const [mySquads, setMySquads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!user) {
                setMySquads([]);
                setLoading(false);
                return;
            }

            if (!isSupabaseReady) {
                setMySquads([]);
                setLoading(false);
                return;
            }

            try {
                const squads = await fetchUserSquads(user.id);
                setMySquads(squads);
            } catch (err) {
                console.error("Failed to load user's squads:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [user, isSupabaseReady]);

    const isMemberOf = (squadId) => mySquads.some(s => String(s.id) === String(squadId));

    return (
        <MySquadsContext.Provider value={{ mySquads, loading, isMemberOf }}>
            {children}
        </MySquadsContext.Provider>
    );
};
