type SavedPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const bytes = window.atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

export function browserPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function enableBrowserPush(vapidPublicKey: string): Promise<SavedPushSubscription> {
  if (!browserPushSupported()) throw new Error("Browser push is not supported by this browser.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Browser notification permission was not granted. Allow notifications in your browser, then try again.");
  await navigator.serviceWorker.register("/notification-sw.js", { scope: "/" });
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(vapidPublicKey),
    });
  }
  const saved = subscription.toJSON();
  if (!saved.endpoint || !saved.keys?.p256dh || !saved.keys.auth) throw new Error("The browser returned an incomplete push subscription.");
  return { endpoint: saved.endpoint, keys: { p256dh: saved.keys.p256dh, auth: saved.keys.auth } };
}

export async function disableBrowserPush() {
  if (!browserPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return null;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
}
