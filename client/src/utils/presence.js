const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;
const ONLINE_WINDOW_MS = 3 * 60 * 1000;

const toMs = (value) => {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
};

export const isUserOnline = (lastSeenAt, nowMs = Date.now()) => {
  const seenMs = toMs(lastSeenAt);
  if (!seenMs) return false;
  return nowMs - seenMs <= ONLINE_WINDOW_MS;
};

export const formatLastSeenLabel = (lastSeenAt, nowMs = Date.now()) => {
  const seenMs = toMs(lastSeenAt);
  if (!seenMs) return 'Offline';

  const deltaMs = Math.max(0, nowMs - seenMs);
  const deltaMinutes = Math.floor(deltaMs / 60000);

  if (deltaMinutes <= 0) return 'Last seen just now';
  if (deltaMinutes < 60) return `Last seen ${deltaMinutes}m ago`;

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `Last seen ${deltaHours}h ago`;

  return `Last seen ${new Date(lastSeenAt).toLocaleDateString()}`;
};

export const startPresenceHeartbeat = (supabaseClient) => {
  if (typeof window === 'undefined' || !supabaseClient) return () => {};

  let inFlight = false;
  let lastSentMs = 0;

  const sendHeartbeat = async () => {
    const now = Date.now();
    if (inFlight || now - lastSentMs < 60_000) return;

    inFlight = true;
    try {
      const { error } = await supabaseClient.rpc('touch_last_seen');
      if (!error) {
        lastSentMs = now;
      }
    } finally {
      inFlight = false;
    }
  };

  const tick = () => {
    if (document.visibilityState === 'visible') {
      void sendHeartbeat();
    }
  };

  void sendHeartbeat();
  const intervalId = window.setInterval(tick, HEARTBEAT_INTERVAL_MS);
  window.addEventListener('focus', tick);
  document.addEventListener('visibilitychange', tick);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener('focus', tick);
    document.removeEventListener('visibilitychange', tick);
  };
};
