import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserSquads } from '../utils/squadMembersApi';

export const useMySquads = () => {
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

    return { mySquads, loading, isMemberOf };
};
