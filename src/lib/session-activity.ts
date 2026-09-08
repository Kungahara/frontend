export const sessionActivityKey = "kungahara:last-activity";
export const inactivityTimeoutMs = 2 * 24 * 60 * 60 * 1000;

export function markSessionActivity(now = Date.now()) {
  try {
    window.localStorage.setItem(sessionActivityKey, String(now));
  } catch { /* The in-memory timer still enforces inactivity when storage is unavailable. */ }
}

export function clearSessionActivity() {
  try {
    window.localStorage.removeItem(sessionActivityKey);
  } catch { /* Session cookies are still cleared by the logout request. */ }
}

export function readSessionActivity() {
  try {
    return Number(window.localStorage.getItem(sessionActivityKey));
  } catch {
    return 0;
  }
}
