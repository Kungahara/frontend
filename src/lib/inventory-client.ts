import { authRequest } from "@/lib/api/client";

let sessionRefresh: Promise<unknown> | null = null;
const pendingGets = new Map<string, Promise<Response>>();

export async function refreshInventorySession() {
  if (!sessionRefresh) {
    sessionRefresh = authRequest("me").finally(() => {
      sessionRefresh = null;
    });
  }
  return sessionRefresh;
}

async function requestWithRefresh(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  if (response.status !== 401) return response;
  await refreshInventorySession();
  return fetch(path, init);
}

export async function inventoryFetch(path: string, init?: RequestInit) {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    const response = await requestWithRefresh(path, init);
    if (response.ok) pendingGets.clear();
    return response;
  }

  // A request carrying an AbortSignal belongs to one component instance.
  // Sharing it would let that component's cleanup abort every other consumer
  // of the same inventory endpoint (notably during React's development checks).
  if (init?.signal) return requestWithRefresh(path, init);

  let pending = pendingGets.get(path);
  if (!pending) {
    pending = requestWithRefresh(path, init);
    pendingGets.set(path, pending);
    const clear = () => window.setTimeout(() => pendingGets.delete(path), 250);
    void pending.then(clear, clear);
  }
  return (await pending).clone();
}
