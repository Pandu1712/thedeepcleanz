import { ADMIN_WS_URL, ADMIN_API_URL } from "@/api/admin-api";

export type LiveEventPayload = {
  type: string;
  data?: any;
  timestamp?: number;
};

type LiveListener = (event: LiveEventPayload) => void;
const listeners = new Set<LiveListener>();

let socket: WebSocket | null = null;
let sseSource: EventSource | null = null;
let reconnectTimer: any = null;
let isStarted = false;

export function subscribeToLiveUpdates(listener: LiveListener): () => void {
  listeners.add(listener);
  startLiveSync();
  return () => {
    listeners.delete(listener);
  };
}

export function notifyLiveListeners(payload: LiveEventPayload) {
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.warn("Live listener error:", e);
    }
  });

  if (typeof window !== "undefined") {
    if (payload.type === "CATALOG_UPDATED") {
      window.dispatchEvent(new CustomEvent("catalog-updated", { detail: payload }));
    } else if (payload.type === "BOOKINGS_UPDATED") {
      window.dispatchEvent(new CustomEvent("bookings-updated", { detail: payload }));
    }
  }
}

export function startLiveSync() {
  if (typeof window === "undefined" || isStarted) return;
  isStarted = true;

  let wsFailures = 0;
  let hasConnectedBefore = false;

  // After a reconnect we may have missed events: ask every screen to re-fetch once.
  const resyncAfterReconnect = () => {
    if (hasConnectedBefore) {
      notifyLiveListeners({ type: "CATALOG_UPDATED", data: { action: "resync" } });
      notifyLiveListeners({ type: "BOOKINGS_UPDATED", data: { action: "resync" } });
    }
    hasConnectedBefore = true;
  };

  const handleMessage = (raw: string) => {
    try {
      const payload = JSON.parse(raw);
      if (payload?.type === "CONNECTED") {
        resyncAfterReconnect();
        return;
      }
      notifyLiveListeners(payload);
    } catch (err) {
      console.warn("Live message parse error:", err);
    }
  };

  function connectWs() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      socket = new WebSocket(ADMIN_WS_URL);
      let opened = false;

      socket.onopen = () => {
        opened = true;
        wsFailures = 0;
        try {
          socket?.send(JSON.stringify({ type: "PING", client: "live-web-client" }));
        } catch {}
      };

      socket.onmessage = (event) => handleMessage(String(event.data));

      socket.onclose = () => {
        socket = null;
        clearTimeout(reconnectTimer);
        if (!opened) wsFailures++;
        // Hosting proxies sometimes block WebSockets: after 3 failed attempts use SSE instead
        if (wsFailures >= 3) {
          connectSse();
          return;
        }
        // Back-off: 3s, 6s, 9s ... capped at 30s
        reconnectTimer = setTimeout(connectWs, Math.min(30000, 3000 * Math.max(1, wsFailures)));
      };

      socket.onerror = () => {
        socket?.close();
      };
    } catch {
      connectSse();
    }
  }

  function connectSse() {
    if (sseSource) return;
    try {
      sseSource = new EventSource(`${ADMIN_API_URL}/api/live-events`);
      sseSource.onmessage = (event) => handleMessage(String(event.data));
      sseSource.onerror = () => {
        // EventSource reconnects by itself; only rebuild it if the browser gave up
        if (sseSource && sseSource.readyState === EventSource.CLOSED) {
          sseSource = null;
          setTimeout(() => {
            wsFailures = 0;
            connectWs();
          }, 10000);
        }
      };
    } catch {}
  }

  connectWs();
}
