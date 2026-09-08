"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { authRequest } from "@/lib/api/client";
import { clearSessionActivity, inactivityTimeoutMs, markSessionActivity, readSessionActivity, sessionActivityKey } from "@/lib/session-activity";

const activityEvents: Array<keyof WindowEventMap> = ["keydown", "pointerdown", "pointermove", "scroll", "touchstart"];
const storageWriteIntervalMs = 60_000;

export function InactivityLogout() {
  const router = useRouter();
  const lastActivity = useRef(0);
  const lastStoredActivity = useRef(0);
  const signingOut = useRef(false);

  useEffect(() => {
    let timer = 0;

    function signOut() {
      if (signingOut.current) return;
      signingOut.current = true;
      clearSessionActivity();
      void authRequest("logout", { method: "POST", body: "{}" })
        .catch(() => null)
        .finally(() => {
          router.replace("/login?reason=inactive");
          router.refresh();
        });
    }

    function scheduleCheck() {
      window.clearTimeout(timer);
      const remaining = inactivityTimeoutMs - (Date.now() - lastActivity.current);
      if (remaining <= 0) {
        signOut();
        return;
      }
      timer = window.setTimeout(checkActivity, remaining);
    }

    function checkActivity() {
      if (Date.now() - lastActivity.current >= inactivityTimeoutMs) signOut();
      else scheduleCheck();
    }

    function recordActivity() {
      const now = Date.now();
      if (now - lastActivity.current >= inactivityTimeoutMs) {
        signOut();
        return;
      }
      lastActivity.current = now;
      if (now - lastStoredActivity.current >= storageWriteIntervalMs) {
        markSessionActivity(now);
        lastStoredActivity.current = now;
      }
    }

    function synchronizeActivity(event: StorageEvent) {
      if (event.key !== sessionActivityKey) return;
      const stored = Number(event.newValue);
      if (Number.isFinite(stored) && stored > lastActivity.current) {
        lastActivity.current = stored;
        scheduleCheck();
      } else if (event.newValue === null) {
        signOut();
      }
    }

    const now = Date.now();
    const stored = readSessionActivity();
    if (Number.isFinite(stored) && stored > 0) {
      lastActivity.current = stored;
      lastStoredActivity.current = stored;
    } else {
      lastActivity.current = now;
      markSessionActivity(now);
      lastStoredActivity.current = now;
    }
    if (now - lastActivity.current >= inactivityTimeoutMs) {
      signOut();
      return;
    }

    activityEvents.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    window.addEventListener("focus", checkActivity);
    window.addEventListener("storage", synchronizeActivity);
    document.addEventListener("visibilitychange", checkActivity);
    scheduleCheck();

    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach((event) => window.removeEventListener(event, recordActivity));
      window.removeEventListener("focus", checkActivity);
      window.removeEventListener("storage", synchronizeActivity);
      document.removeEventListener("visibilitychange", checkActivity);
    };
  }, [router]);

  return null;
}
