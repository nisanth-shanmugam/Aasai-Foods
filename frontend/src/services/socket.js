/**
 * Aasai Foods — Real-time WebSocket service
 *
 * Architecture choice: Django Channels (WebSocket)
 * ─────────────────────────────────────────────────
 * WHY WebSocket over polling / Firebase / Supabase:
 *  • Stack is already Django — Channels adds WS with zero extra service cost
 *  • Bi-directional: admin mutations push to server, server fans out to all clients
 *  • Sub-100 ms latency vs ~2-5 s polling intervals
 *  • No third-party vendor lock-in or per-message pricing
 *
 * Flow:
 *  Admin action → REST API → Django view → broadcast() → Channel Layer
 *    → LiveConsumer.broadcast() → every connected WebSocket client
 *    → socket.js dispatches typed event → React context updates state
 */

const WS_URL = "ws://localhost:8000/ws/live/";
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT = 10;

let socket = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let manualClose = false;

// Typed listener registry  { eventType: Set<callback> }
const listeners = {};

// Connection state observers  Set<callback(state)>
// state: "connecting" | "connected" | "disconnected"
const stateObservers = new Set();

function notifyState(state) {
  stateObservers.forEach((cb) => cb(state));
}

export function onConnectionState(cb) {
  stateObservers.add(cb);
  return () => stateObservers.delete(cb);
}

// ── Connect ───────────────────────────────────────────────────────

export function initSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  manualClose = false;
  notifyState("connecting");

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    reconnectAttempts = 0;
    notifyState("connected");
  };

  socket.onmessage = (e) => {
    try {
      const { type, data } = JSON.parse(e.data);
      dispatch(type, data);
    } catch {
      // ignore malformed frames
    }
  };

  socket.onclose = () => {
    notifyState("disconnected");
    if (!manualClose && reconnectAttempts < MAX_RECONNECT) {
      reconnectAttempts++;
      reconnectTimer = setTimeout(initSocket, RECONNECT_DELAY_MS);
    }
  };

  socket.onerror = () => {
    socket.close();
  };
}

export function disconnectSocket() {
  manualClose = true;
  clearTimeout(reconnectTimer);
  socket?.close();
  socket = null;
}

// ── Publish (client → server → all clients) ──────────────────────

export function publish(type, data) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, data }));
  }
}

// ── Internal dispatcher ───────────────────────────────────────────

function dispatch(type, data) {
  (listeners[type] || []).forEach((cb) => cb(data));
}

// ── Subscribe / unsubscribe helpers ──────────────────────────────

function on(type, cb) {
  if (!listeners[type]) listeners[type] = [];
  listeners[type].push(cb);
}

function off(type, cb) {
  listeners[type] = (listeners[type] || []).filter((fn) => fn !== cb);
}

// ── Product events ────────────────────────────────────────────────

export const onProductCreated      = (cb) => on("product:created", cb);
export const onProductUpdated      = (cb) => on("product:updated", cb);
export const onProductDeleted      = (cb) => on("product:deleted", cb);
export const onProductStockChanged = (cb) => on("product:stock_changed", cb);

export const offProductCreated      = (cb) => off("product:created", cb);
export const offProductUpdated      = (cb) => off("product:updated", cb);
export const offProductDeleted      = (cb) => off("product:deleted", cb);
export const offProductStockChanged = (cb) => off("product:stock_changed", cb);

// ── Order events ──────────────────────────────────────────────────

export const onOrderCreated       = (cb) => on("order:created", cb);
export const onOrderUpdated       = (cb) => on("order:updated", cb);
export const onOrderStatusChanged = (cb) => on("order:status_changed", cb);

export const offOrderCreated       = (cb) => off("order:created", cb);
export const offOrderUpdated       = (cb) => off("order:updated", cb);
export const offOrderStatusChanged = (cb) => off("order:status_changed", cb);

// ── Legacy emit shims (kept so existing contexts don't break) ─────
// Mutations now go through REST → backend broadcast instead of these.
// These are no-ops but kept to avoid import errors during transition.
export const emitProductCreated      = () => {};
export const emitProductUpdated      = () => {};
export const emitProductDeleted      = () => {};
export const emitProductStockChanged = () => {};
export const emitOrderCreated        = () => {};
export const emitOrderUpdated        = () => {};
export const emitOrderStatusChanged  = () => {};
export const getSocket               = () => socket;
