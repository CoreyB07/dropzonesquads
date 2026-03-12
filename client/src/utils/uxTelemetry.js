const STORAGE_KEY = 'dzs_ux_events';

export const trackUxEvent = (name, meta = {}) => {
    try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const next = [
            ...existing,
            {
                name,
                meta,
                ts: new Date().toISOString()
            }
        ].slice(-200);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        // Keep visible in dev console for quick UX debugging.
        // eslint-disable-next-line no-console
        console.info('[UX_EVENT]', name, meta);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to track UX event:', error);
    }
};

export const readUxEvents = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
};
