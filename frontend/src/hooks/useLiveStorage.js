import { useState, useEffect, useCallback } from "react";

/**
 * useLiveStorage — drop-in replacement for useState that:
 *  1. Persists to localStorage
 *  2. Syncs across browser tabs via the "storage" event
 *  3. Syncs within the same tab via BroadcastChannel
 */
export function useLiveStorage(key, initialValue) {
  const read = () => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [state, setState] = useState(read);

  const write = useCallback((value) => {
    setState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(next));
        try {
          const ch = new BroadcastChannel(`ls_${key}`);
          ch.postMessage(next);
          ch.close();
        } catch { /* BroadcastChannel not supported */ }
      } catch { /* storage quota */ }
      return next;
    });
  }, [key]);

  useEffect(() => {
    // Cross-tab sync
    const onStorage = (e) => {
      if (e.key === key) {
        try { setState(e.newValue ? JSON.parse(e.newValue) : initialValue); }
        catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", onStorage);

    // Same-page sync (admin ↔ customer in same SPA session)
    let ch = null;
    try {
      ch = new BroadcastChannel(`ls_${key}`);
      ch.onmessage = (e) => setState(e.data);
    } catch { /* not supported */ }

    return () => {
      window.removeEventListener("storage", onStorage);
      try { ch?.close(); } catch { /* ignore */ }
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return [state, write];
}
