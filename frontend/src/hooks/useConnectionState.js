import { useState, useEffect } from "react";
import { onConnectionState, initSocket } from "../services/socket";

/**
 * Returns current WebSocket connection state:
 *  "connecting" | "connected" | "disconnected"
 */
export function useConnectionState() {
  const [state, setState] = useState("connecting");

  useEffect(() => {
    initSocket();
    const unsub = onConnectionState(setState);
    return unsub;
  }, []);

  return state;
}
