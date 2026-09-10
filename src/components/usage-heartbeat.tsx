"use client";

import { useEffect } from "react";

export function UsageHeartbeat() {
  useEffect(() => {
    const send = () => {
      if (document.visibilityState === "visible") {
        void fetch("/api/usage-heartbeat", { method: "POST" });
      }
    };
    send();
    const interval = window.setInterval(send, 60_000);
    document.addEventListener("visibilitychange", send);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", send);
    };
  }, []);
  return null;
}
