"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useWorkspaceCopy } from "@/components/workspace-copy-translator";
import { CloudUpload, Download, Monitor, Moon, ShieldAlert, Sun, Upload, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import { useAuthUser } from "@/components/auth-user-context";
import { AppPageSkeleton } from "@/components/app-page-skeleton";
import { TeamSettingsSection, type Invitation, type TeamMember } from "@/components/team-settings-section";
import { apiErrorMessage, authRequest, type AuthUser } from "@/lib/api/client";
import { browserPushSupported, disableBrowserPush, enableBrowserPush } from "@/lib/browser-push";
import { inventoryFetch } from "@/lib/inventory-client";

type ThemeMode = "light" | "dark" | "system";
type Scope = "today" | "month" | "year";
type AppLanguage = "rw" | "en" | "fr";
type Preferences = {
  theme: ThemeMode;
  scope: Scope;
  salesReminders: boolean;
  noonReminder: boolean;
  eveningReminder: boolean;
  loanReminders: boolean;
  workingDays: string[];
  emailDelivery: boolean;
  browserPushDelivery: boolean;
};

type NotificationPreferences = {
  emailEnabled: boolean;
  browserPushEnabled: boolean;
  browserPushSupported: boolean;
  vapidPublicKey: string;
};

type TeamData = { members: TeamMember[]; invitations: Invitation[] };

const preferenceKey = "kungahara:settings";
const languageKey = "kungahara:language";
const defaultPreferences: Preferences = { theme: "light", scope: "month", salesReminders: true, noonReminder: true, eveningReminder: true, loanReminders: true, workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], emailDelivery: false, browserPushDelivery: false };
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const languages: Array<{ value: AppLanguage; shortLabel: string; label: string }> = [
  { value: "rw", shortLabel: "RW", label: "Kinyarwanda" },
  { value: "en", shortLabel: "EN", label: "English" },
  { value: "fr", shortLabel: "FR", label: "French" },
];

function savedLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(languageKey);
    return saved === "rw" || saved === "fr" ? saved : "en";
  } catch { return "en"; }
}

function Switch({ checked, disabled = false, label, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <button className={`settings-switch${checked ? " active" : ""}`} type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}><span /></button>;
}

export function SettingsContent() {
  const router = useRouter();
  const commonText = useTranslations("Common");
  const loadingText = useTranslations("Loading");
  const tr = useWorkspaceCopy();
  const { user, setUser } = useAuthUser();
  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof window === "undefined") return defaultPreferences;
    try {
      const saved = JSON.parse(window.localStorage.getItem(preferenceKey) ?? "null") as Partial<Preferences> | null;
      if (saved) return { ...defaultPreferences, ...saved };
      const savedTheme = window.localStorage.getItem("kungahara:dashboard-theme");
      const savedScope = window.localStorage.getItem("kungahara:dashboard-scope");
      return {
        ...defaultPreferences,
        theme: savedTheme === "dark" || savedTheme === "system" ? savedTheme : "light",
        scope: savedScope === "today" || savedScope === "year" ? savedScope : "month",
      };
    } catch { return defaultPreferences; }
  });
  const [language, setLanguage] = useState<AppLanguage>(savedLanguage);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [businessName, setBusinessName] = useState(user.businessName ?? "");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState("");
  const [teamData, setTeamData] = useState<TeamData | null>(user.role === "owner" ? null : { members: [], invitations: [] });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [initialError, setInitialError] = useState("");

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const [notificationResponse, teamResponse] = await Promise.all([
          inventoryFetch("/api/notifications/preferences", { cache: "no-store" }),
          user.role === "owner" ? inventoryFetch("/api/team", { cache: "no-store" }) : Promise.resolve(null),
        ]);
        const body = await notificationResponse.json().catch(() => null) as NotificationPreferences | null;
        const loadedTeam = teamResponse ? await teamResponse.json().catch(() => null) as TeamData | null : { members: [], invitations: [] };
        if (!notificationResponse.ok || !body) throw new Error("Unable to load notification delivery settings.");
        if (teamResponse && (!teamResponse.ok || !loadedTeam)) throw new Error("Unable to load business members.");
        if (!active) return;
        setVapidPublicKey(body.vapidPublicKey);
        setTeamData(loadedTeam);
        setPreferences((saved) => {
          const next = { ...saved, emailDelivery: body.emailEnabled, browserPushDelivery: body.browserPushEnabled };
          window.localStorage.setItem(preferenceKey, JSON.stringify(next));
          return next;
        });
      } catch (reason) {
        if (active) setInitialError(reason instanceof Error ? reason.message : "Unable to load settings.");
      } finally {
        if (active) setSettingsLoading(false);
      }
    }
    void initialize();
    return () => { active = false; };
  }, [user.role]);

  useEffect(() => {
    function syncLanguage(event: Event) {
      const next = (event as CustomEvent<{ language?: string }>).detail?.language;
      if (next === "rw" || next === "en" || next === "fr") setLanguage(next);
    }
    window.addEventListener("kungahara:language-changed", syncLanguage);
    return () => window.removeEventListener("kungahara:language-changed", syncLanguage);
  }, []);

  function savePreferences(next: Preferences) {
    setPreferences(next);
    window.localStorage.setItem(preferenceKey, JSON.stringify(next));
    window.localStorage.setItem("kungahara:dashboard-theme", next.theme);
    window.localStorage.setItem("kungahara:dashboard-scope", next.scope);
    window.dispatchEvent(new CustomEvent("kungahara:settings-changed", { detail: next }));
  }

  function selectLanguage(next: AppLanguage) {
    setLanguage(next);
    try { window.localStorage.setItem(languageKey, next); } catch { /* Keep the selection for this visit. */ }
    window.dispatchEvent(new CustomEvent("kungahara:language-changed", { detail: { language: next } }));
    void fetch("/api/language", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: next }) }).finally(() => window.location.reload());
  }

  async function updateDelivery(channel: "email" | "browser", enabled: boolean) {
    setBusy(`delivery-${channel}`); setError(""); setMessage("");
    try {
      if (channel === "email") {
        const response = await inventoryFetch("/api/notifications/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emailEnabled: enabled }) });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(apiErrorMessage(body, "Unable to update email delivery."));
        savePreferences({ ...preferences, emailDelivery: enabled });
        setMessage(`Email notifications ${enabled ? "enabled" : "disabled"}.`);
        return;
      }

      if (enabled) {
        if (!browserPushSupported()) throw new Error("Browser push is not supported by this browser.");
        if (!vapidPublicKey) throw new Error("Browser push is not configured yet. Refresh the page and try again.");
        const subscription = await enableBrowserPush(vapidPublicKey);
        const subscriptionResponse = await inventoryFetch("/api/notifications/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
        const subscriptionBody = await subscriptionResponse.json().catch(() => null);
        if (!subscriptionResponse.ok) throw new Error(subscriptionBody?.error?.message ?? "Unable to save the browser subscription.");
      } else {
        const endpoint = await disableBrowserPush();
        if (endpoint) await inventoryFetch("/api/notifications/subscription", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint }) });
      }
      const response = await inventoryFetch("/api/notifications/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ browserPushEnabled: enabled }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "Unable to update browser push delivery."));
      savePreferences({ ...preferences, browserPushDelivery: enabled });
      setMessage(`Browser push notifications ${enabled ? "enabled" : "disabled"}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update notification delivery.");
    } finally { setBusy(""); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("profile"); setError(""); setMessage("");
    try {
      const details = { firstName, lastName, ...(user?.role === "owner" ? { businessName } : {}) };
      const result = await authRequest<{ user: AuthUser }>("me", { method: "PATCH", body: JSON.stringify(details) });
      setUser(result.user); setMessage("Profile and business details saved.");
      window.dispatchEvent(new CustomEvent("kungahara:user-changed", { detail: result.user }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save your details."); }
    finally { setBusy(""); }
  }

  async function uploadPicture(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0]; event.target.value = ""; if (!image) return;
    setBusy("picture"); setError(""); const formData = new FormData(); formData.set("image", image);
    const response = await fetch("/api/profile-picture", { method: "POST", body: formData });
    const body = await response.json().catch(() => null);
    if (!response.ok) setError(apiErrorMessage(body, "Unable to upload the picture."));
    else { setUser(body.user); setMessage("Profile picture updated."); window.dispatchEvent(new CustomEvent("kungahara:user-changed", { detail: body.user })); }
    setBusy("");
  }

  async function sendPasswordLink() {
    if (!user) return; setBusy("password"); setError(""); setMessage("");
    try { const result = await authRequest<{ message: string }>("forgot-password", { method: "POST", body: JSON.stringify({ email: user.email }) }); setMessage(result.message); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to send the password link."); }
    finally { setBusy(""); }
  }

  async function exportData(kind: "sales" | "stock" | "loans") {
    setBusy(`export-${kind}`); setError(""); setMessage("");
    try {
      const session = await fetch("/api/auth/me", { cache: "no-store" });
      if (!session.ok) {
        const body = await session.json().catch(() => null);
        throw new Error(apiErrorMessage(body, "Your session has expired. Please sign in again."));
      }
      const date = new Date().toISOString().slice(0, 10);
      const counterKey = `kungahara:export-copy:${kind}:${date}`;
      const savedCounter = Number.parseInt(window.localStorage.getItem(counterKey) ?? "1", 10);
      const copyNumber = Number.isFinite(savedCounter) && savedCounter > 0 ? savedCounter : 1;
      window.localStorage.setItem(counterKey, String(copyNumber + 1));
      window.open(`/api/exports/${kind}?copy=${copyNumber}`, "_self");
      setMessage(`${kind[0].toUpperCase()}${kind.slice(1)} PDF download started.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `Unable to export ${kind}.`);
    } finally {
      setBusy("");
    }
  }

  async function deleteAccount() {
    setBusy("delete"); setError("");
    const response = await fetch("/api/auth/me", { method: "DELETE" });
    if (!response.ok) { const body = await response.json().catch(() => null); setError(apiErrorMessage(body, "Unable to delete the account.")); setBusy(""); return; }
    router.replace("/login");
    router.refresh();
  }

  const initials = `${user?.firstName[0] ?? ""}${user?.lastName[0] ?? ""}`.toUpperCase();
  if (settingsLoading) return <AppPageSkeleton variant="settings" label={loadingText("settings")} embedded />;
  if (initialError || (user.role === "owner" && !teamData)) return <div className="settings-initial-state error" role="alert"><strong>Unable to load settings</strong><small>{initialError || "The complete member list could not be loaded."}</small><button type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  return <div className="settings-page">
    {(message || error) && <div className={`settings-feedback${error ? " error" : ""}`} role={error ? "alert" : "status"}><span>{error || message}</span><button type="button" aria-label="Dismiss notification" onClick={() => { setMessage(""); setError(""); }}><X aria-hidden="true" /></button></div>}

    <section className="settings-section" aria-label="Profile and business settings">
      <div className="settings-picture-row"><span className={`settings-avatar${user?.profileImageUrl ? " has-image" : ""}`}>{user?.profileImageUrl ? <Image src={user.profileImageUrl} alt="Profile" width={72} height={72} unoptimized /> : initials || <Upload aria-hidden="true" />}</span><div><strong>Profile picture</strong><small>JPEG, PNG or WebP, up to 5 MB.</small></div><label className="settings-secondary-button"><CloudUpload aria-hidden="true" />{busy === "picture" ? commonText("uploading") : "Change picture"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!!busy} onChange={uploadPicture} /></label></div>
      <form className="settings-form-grid" onSubmit={saveProfile}><label>First name<input required maxLength={100} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label>Last name<input required maxLength={100} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label><label className="wide">Business name<input required maxLength={200} disabled={user.role !== "owner"} value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label><button className="settings-primary-button" disabled={!!busy || !user} type="submit">{busy === "profile" ? commonText("saving") : "Save details"}</button></form>
    </section>

    <section className="settings-section settings-appearance-section" aria-label="Dashboard and appearance settings">
      <div className="settings-row"><div><strong>Dashboard time scope</strong><small>Default period used by dashboard summaries.</small></div><div className="settings-choice-group">{(["today", "month", "year"] as Scope[]).map((scope) => <button className={preferences.scope === scope ? "active" : ""} type="button" key={scope} onClick={() => savePreferences({ ...preferences, scope })}>{scope === "today" ? "Today" : scope === "month" ? "This month" : "This year"}</button>)}</div></div>
      <div className="settings-row"><div><strong>Theme</strong><small>Use a light, dark, or system-matched workspace.</small></div><div className="settings-choice-group settings-theme-choice">{(["light", "dark", "system"] as ThemeMode[]).map((theme) => {
        const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
        return <button className={preferences.theme === theme ? "active" : ""} type="button" aria-pressed={preferences.theme === theme} key={theme} onClick={() => savePreferences({ ...preferences, theme })}><ThemeIcon aria-hidden="true" />{theme[0].toUpperCase() + theme.slice(1)}</button>;
      })}</div></div>
      <div className="settings-row settings-language-row"><div><strong>Language</strong><small>{languages.find((item) => item.value === language)?.label} is the current application language.</small></div><div className="settings-choice-group settings-language-choice" role="group" aria-label="Application language">{languages.map((item) => <button className={language === item.value ? "active" : ""} type="button" aria-label={`Use ${item.label}`} title={item.label} aria-pressed={language === item.value} key={item.value} onClick={() => selectLanguage(item.value)}>{item.shortLabel}</button>)}</div></div>
    </section>

    <section className="settings-section" aria-label="Notification and reminder settings">
      <div className="settings-row"><div><strong>Sales reminders</strong><small>Notify you when no sale has been recorded on a working day.</small></div><Switch label="Sales reminders" checked={preferences.salesReminders} onChange={(salesReminders) => savePreferences({ ...preferences, salesReminders })} /></div>
      <div className="settings-row nested"><div><strong>Noon reminder</strong><small>Shown after 12:00 PM.</small></div><Switch label="Noon reminder" disabled={!preferences.salesReminders} checked={preferences.salesReminders && preferences.noonReminder} onChange={(noonReminder) => savePreferences({ ...preferences, noonReminder })} /></div>
      <div className="settings-row nested"><div><strong>Evening reminder</strong><small>Shown after 8:00 PM.</small></div><Switch label="8 PM reminder" disabled={!preferences.salesReminders} checked={preferences.salesReminders && preferences.eveningReminder} onChange={(eveningReminder) => savePreferences({ ...preferences, eveningReminder })} /></div>
      <div className="settings-row working-days"><div><strong>{tr("Working days")}</strong><small>{tr("Sales reminders only appear on selected days.")}</small></div><div className="settings-day-picker">{days.map((day) => <button className={preferences.workingDays.includes(day) ? "active" : ""} type="button" aria-pressed={preferences.workingDays.includes(day)} key={day} onClick={() => savePreferences({ ...preferences, workingDays: preferences.workingDays.includes(day) ? preferences.workingDays.filter((item) => item !== day) : [...preferences.workingDays, day] })}>{tr(day)}</button>)}</div></div>
      <div className="settings-row"><div><strong>Loan deadline reminders</strong><small>Keep the existing reminders for upcoming loan repayment dates.</small></div><Switch label="Loan reminders" checked={preferences.loanReminders} onChange={(loanReminders) => savePreferences({ ...preferences, loanReminders })} /></div>
      <div className="settings-row"><div><strong>Delivery</strong><small>Choose where stock, sales, and loan alerts should reach you.</small></div><div className="settings-delivery"><span className="available">In-app · on</span><button type="button" className={preferences.emailDelivery ? "active" : ""} aria-pressed={preferences.emailDelivery} disabled={!!busy} onClick={() => void updateDelivery("email", !preferences.emailDelivery)}>Email · {busy === "delivery-email" ? "saving…" : preferences.emailDelivery ? "on" : "off"}</button><button type="button" className={preferences.browserPushDelivery ? "active" : ""} aria-pressed={preferences.browserPushDelivery} disabled={!!busy || !browserPushSupported()} onClick={() => void updateDelivery("browser", !preferences.browserPushDelivery)}>Browser push · {busy === "delivery-browser" ? "saving…" : preferences.browserPushDelivery ? "on" : "off"}</button></div></div>
    </section>

    <section className="settings-section" aria-label="Security settings"><div className="settings-row"><div><strong>Change password</strong><small>A secure password-change link will be sent to {user?.email ?? "your email"}.</small></div><button className="settings-secondary-button" type="button" disabled={!!busy || !user} onClick={() => void sendPasswordLink()}>{busy === "password" ? commonText("sending") : "Send change link"}</button></div></section>

    {user.role === "owner" && teamData && <TeamSettingsSection currentUser={user} initialMembers={teamData.members} initialInvitations={teamData.invitations} />}

    <section className="settings-section" aria-label="Data and account settings">
      <div className="settings-export-grid">{(["stock", "sales", "loans"] as const).map((kind) => <button type="button" disabled={!!busy} key={kind} aria-label={`Export ${kind} as PDF`} onClick={() => void exportData(kind)}><Download /><span><strong>Export {kind}</strong><small>Download PDF</small></span></button>)}</div>
      <div className="settings-danger-row"><span><ShieldAlert /></span><div><strong>Delete account</strong><small>This permanently removes your account and cannot be undone.</small></div><button type="button" onClick={() => setDeleteOpen(true)}>Delete account</button></div>
    </section>

    {deleteOpen && <div className="settings-dialog-backdrop"><div className="settings-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><ShieldAlert /><h3 id="delete-account-title">Delete your account?</h3><p>Your account and any business data owned only by this account will be permanently removed.</p><div><button type="button" onClick={() => setDeleteOpen(false)}>Cancel</button><button className="danger" type="button" disabled={busy === "delete"} onClick={() => void deleteAccount()}>{busy === "delete" ? commonText("deleting") : "Delete permanently"}</button></div></div></div>}
  </div>;
}
