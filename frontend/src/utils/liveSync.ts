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

  function connectWs() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      socket = new WebSocket(ADMIN_WS_URL);

      socket.onopen = () => {
        try {
          socket?.send(JSON.stringify({ type: "PING", client: "live-web-client" }));
        } catch {}
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          notifyLiveListeners(payload);
        } catch (err) {
          console.warn("WS message parse error:", err);
        }
      };

      socket.onclose = () => {
        socket = null;
        clearTimeout(reconnectTimer);
        // Instant backoff retry
        reconnectTimer = setTimeout(connectWs, 3000);
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
      sseSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          notifyLiveListeners(payload);
        } catch {}
      };
      sseSource.onerror = () => {
        sseSource?.close();
        sseSource = null;
        setTimeout(connectWs, 5000);
      };
    } catch {}
  }

  connectWs();
}
