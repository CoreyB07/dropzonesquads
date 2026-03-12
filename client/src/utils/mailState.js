const STORAGE_PREFIX = 'mailReadState_';
const CHANGE_EVENT = 'warzone-mail-read-state';

const EMPTY_STATE = {
    conversations: {},
    squads: {},
};

const parseState = (value) => {
    if (!value) {
        return EMPTY_STATE;
    }

    try {
        const parsed = JSON.parse(value);
        return {
            conversations: parsed?.conversations && typeof parsed.conversations === 'object' ? parsed.conversations : {},
            squads: parsed?.squads && typeof parsed.squads === 'object' ? parsed.squads : {},
        };
    } catch {
        return EMPTY_STATE;
    }
};

const getStorageKey = (userId) => `${STORAGE_PREFIX}${userId}`;

const readState = (userId) => {
    if (!userId || typeof window === 'undefined') {
        return EMPTY_STATE;
    }

    return parseState(window.localStorage.getItem(getStorageKey(userId)));
};

const emitChange = (userId, state) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent(CHANGE_EVENT, {
            detail: { userId, state },
        })
    );
};

const writeState = (userId, updater) => {
    if (!userId || typeof window === 'undefined') {
        return EMPTY_STATE;
    }

    const current = readState(userId);
    const next = updater(current);
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
    emitChange(userId, next);
    return next;
};

const toTimestamp = (value) => {
    if (!value) {
        return 0;
    }

    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
};

const keepLatest = (currentValue, nextValue) => (
    toTimestamp(nextValue) >= toTimestamp(currentValue) ? nextValue : currentValue
);

export const isUnreadAfterReadAt = (itemTime, readAt) => {
    if (!itemTime) {
        return false;
    }

    if (!readAt) {
        return true;
    }

    return toTimestamp(itemTime) > toTimestamp(readAt);
};

export const getConversationReadAt = (userId, conversationId) => (
    readState(userId).conversations[String(conversationId)] || null
);

export const getSquadReadAt = (userId, squadId) => (
    readState(userId).squads[String(squadId)] || null
);

export const markConversationRead = (userId, conversationId, readAt = new Date().toISOString()) => {
    if (!conversationId) {
        return EMPTY_STATE;
    }

    return writeState(userId, (current) => ({
        ...current,
        conversations: {
            ...current.conversations,
            [String(conversationId)]: keepLatest(current.conversations[String(conversationId)], readAt),
        },
    }));
};

export const markSquadRead = (userId, squadId, readAt = new Date().toISOString()) => {
    if (!squadId) {
        return EMPTY_STATE;
    }

    return writeState(userId, (current) => ({
        ...current,
        squads: {
            ...current.squads,
            [String(squadId)]: keepLatest(current.squads[String(squadId)], readAt),
        },
    }));
};

export const subscribeToMailReadState = (userId, callback) => {
    if (!userId || typeof window === 'undefined') {
        return () => {};
    }

    const handleStorage = (event) => {
        if (event.key && event.key !== getStorageKey(userId)) {
            return;
        }

        callback(readState(userId));
    };

    const handleCustomEvent = (event) => {
        if (event.detail?.userId !== userId) {
            return;
        }

        callback(event.detail.state || readState(userId));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CHANGE_EVENT, handleCustomEvent);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(CHANGE_EVENT, handleCustomEvent);
    };
};
