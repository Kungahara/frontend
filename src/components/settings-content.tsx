"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, Camera, Database, Download, KeyRound, MonitorCog, ShieldAlert, UserRound } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import { CustomSelect } from "@/components/custom-select";
import { authRequest, type AuthUser } from "@/lib/api/client";

type ThemeMode = "light" | "dark" | "system";
type Scope = "today" | "month" | "year";
type Preferences = {
  theme: ThemeMode;
  scope: Scope;
  salesReminders: boolean;
  noonReminder: boolean;
  eveningReminder: boolean;
  loanReminders: boolean;
  workingDays: string[];
};

const preferenceKey = "kungahara:settings";
const defaultPreferences: Preferences = { theme: "light", scope: "month", salesReminders: true, noonReminder: true, eveningReminder: true, loanReminders: true, workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] };
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Switch({ checked, disabled = false, label, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <button className={`settings-switch${checked ? " active" : ""}`} type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}><span /></button>;
}

export function SettingsContent() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    authRequest<{ user: AuthUser }>("me").then(({ user: current }) => {
      setUser(current); setFirstName(current.firstName); setLastName(current.lastName); setBusinessName(current.businessName ?? "");
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load settings."));
  }, []);

  function savePreferences(next: Preferences) {
    setPreferences(next);
    window.localStorage.setItem(preferenceKey, JSON.stringify(next));
    window.localStorage.setItem("kungahara:dashboard-theme", next.theme);
    window.localStorage.setItem("kungahara:dashboard-scope", next.scope);
    window.dispatchEvent(new CustomEvent("kungahara:settings-changed", { detail: next }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("profile"); setError(""); setMessage("");
    try {
      const details = { firstName, lastName, ...(["owner", "admin"].includes(user?.role ?? "") ? { businessName } : {}) };
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
    if (!response.ok) setError(body?.error?.message ?? "Unable to upload the picture.");
    else { setUser(body.user); setMessage("Profile picture updated."); window.dispatchEvent(new CustomEvent("kungahara:user-changed", { detail: body.user })); }
    setBusy("");
  }

  async function sendPasswordLink() {
    if (!user) return; setBusy("password"); setError(""); setMessage("");
    try { const result = await authRequest<{ message: string }>("forgot-password", { method: "POST", body: JSON.stringify({ email: user.email }) }); setMessage(result.message); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to send the password link."); }
    finally { setBusy(""); }
  }

  async function exportData(kind: "sales" | "stock" | "loans" | "documents") {
    setBusy(`export-${kind}`); setError("");
    try {
      const urls = kind === "stock" ? ["/api/products"] : kind === "documents" ? ["/api/document-folders", "/api/document-photos"] : [`/api/${kind}`];
      const responses = await Promise.all(urls.map((url) => fetch(url)));
      if (responses.some((response) => !response.ok)) throw new Error(`Unable to export ${kind}.`);
      const values = await Promise.all(responses.map((response) => response.json()));
      const content = kind === "documents" ? { folders: values[0].folders ?? [], documents: values[1].photos ?? [] } : values[0];
      const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = `kungahara-${kind}-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
      setMessage(`${kind[0].toUpperCase()}${kind.slice(1)} export downloaded.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : `Unable to export ${kind}.`); }
    finally { setBusy(""); }
  }

  async function deleteAccount() {
    setBusy("delete"); setError("");
    const response = await fetch("/api/auth/me", { method: "DELETE" });
    if (!response.ok) { const body = await response.json().catch(() => null); setError(body?.error?.message ?? "Unable to delete the account."); setBusy(""); return; }
    router.replace("/login");
    router.refresh();
  }

  const initials = `${user?.firstName[0] ?? ""}${user?.lastName[0] ?? ""}`.toUpperCase();
  return <div className="settings-page">
    {(message || error) && <p className={`settings-feedback${error ? " error" : ""}`} role={error ? "alert" : "status"}>{error || message}</p>}

    <section className="settings-section" aria-labelledby="profile-settings"><header><span><UserRound /></span><div><h2 id="profile-settings">Profile &amp; business</h2><p>Your identity and the business name shown throughout the workspace.</p></div></header>
      <div className="settings-picture-row"><span className={`settings-avatar${user?.profileImageUrl ? " has-image" : ""}`}>{user?.profileImageUrl ? <Image src={user.profileImageUrl} alt="Profile" width={72} height={72} unoptimized /> : initials || <Camera />}</span><div><strong>Profile picture</strong><small>JPEG, PNG or WebP, up to 5 MB.</small></div><label className="settings-secondary-button">{busy === "picture" ? "Uploading…" : "Change picture"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!!busy} onChange={uploadPicture} /></label></div>
      <form className="settings-form-grid" onSubmit={saveProfile}><label>First name<input required maxLength={100} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label>Last name<input required maxLength={100} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label><label className="wide">Business name<input required maxLength={200} disabled={!!user && !["owner", "admin"].includes(user.role)} value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label><button className="settings-primary-button" disabled={!!busy || !user} type="submit">{busy === "profile" ? "Saving…" : "Save details"}</button></form>
    </section>

    <section className="settings-section" aria-labelledby="appearance-settings"><header><span><MonitorCog /></span><div><h2 id="appearance-settings">Dashboard &amp; appearance</h2><p>Choose the default dashboard view and visual theme.</p></div></header>
      <div className="settings-row"><div><strong>Dashboard time scope</strong><small>Default period used by dashboard summaries.</small></div><div className="settings-choice-group">{(["today", "month", "year"] as Scope[]).map((scope) => <button className={preferences.scope === scope ? "active" : ""} type="button" key={scope} onClick={() => savePreferences({ ...preferences, scope })}>{scope === "today" ? "Today" : scope === "month" ? "This month" : "This year"}</button>)}</div></div>
      <div className="settings-row"><div><strong>Theme</strong><small>Use a light, dark, or system-matched workspace.</small></div><div className="settings-choice-group">{(["light", "dark", "system"] as ThemeMode[]).map((theme) => <button className={preferences.theme === theme ? "active" : ""} type="button" key={theme} onClick={() => savePreferences({ ...preferences, theme })}>{theme[0].toUpperCase() + theme.slice(1)}</button>)}</div></div>
      <div className="settings-row"><div><strong>Language</strong><small>Kinyarwanda is visible but is not available yet.</small></div><CustomSelect className="settings-language-select" label="Language" value="en" options={[{ label: "English", value: "en" }, { label: "Kinyarwanda — coming soon", value: "rw", disabled: true }]} onChange={() => undefined} /></div>
    </section>

    <section className="settings-section" aria-labelledby="notification-settings"><header><span><Bell /></span><div><h2 id="notification-settings">Notifications &amp; reminders</h2><p>Control the reminders that appear while you work.</p></div></header>
      <div className="settings-row"><div><strong>Sales reminders</strong><small>Notify you when no sale has been recorded on a working day.</small></div><Switch label="Sales reminders" checked={preferences.salesReminders} onChange={(salesReminders) => savePreferences({ ...preferences, salesReminders })} /></div>
      <div className="settings-row nested"><div><strong>Noon reminder</strong><small>Shown after 12:00 PM.</small></div><Switch label="Noon reminder" disabled={!preferences.salesReminders} checked={preferences.salesReminders && preferences.noonReminder} onChange={(noonReminder) => savePreferences({ ...preferences, noonReminder })} /></div>
      <div className="settings-row nested"><div><strong>Evening reminder</strong><small>Shown after 8:00 PM.</small></div><Switch label="8 PM reminder" disabled={!preferences.salesReminders} checked={preferences.salesReminders && preferences.eveningReminder} onChange={(eveningReminder) => savePreferences({ ...preferences, eveningReminder })} /></div>
      <div className="settings-row working-days"><div><strong>Working days</strong><small>Sales reminders only appear on selected days.</small></div><div className="settings-day-picker">{days.map((day) => <button className={preferences.workingDays.includes(day) ? "active" : ""} type="button" aria-pressed={preferences.workingDays.includes(day)} key={day} onClick={() => savePreferences({ ...preferences, workingDays: preferences.workingDays.includes(day) ? preferences.workingDays.filter((item) => item !== day) : [...preferences.workingDays, day] })}>{day}</button>)}</div></div>
      <div className="settings-row"><div><strong>Loan deadline reminders</strong><small>Keep the existing reminders for upcoming loan repayment dates.</small></div><Switch label="Loan reminders" checked={preferences.loanReminders} onChange={(loanReminders) => savePreferences({ ...preferences, loanReminders })} /></div>
      <div className="settings-row"><div><strong>Delivery</strong><small>In-app notifications are currently supported.</small></div><div className="settings-delivery"><span className="available">In-app</span><span>Email · coming soon</span><span>Browser push · coming soon</span></div></div>
    </section>

    <section className="settings-section" aria-labelledby="security-settings"><header><span><KeyRound /></span><div><h2 id="security-settings">Security</h2><p>Protect access to your Kungahara account.</p></div></header><div className="settings-row"><div><strong>Change password</strong><small>A secure password-change link will be sent to {user?.email ?? "your email"}.</small></div><button className="settings-secondary-button" type="button" disabled={!!busy || !user} onClick={() => void sendPasswordLink()}>{busy === "password" ? "Sending…" : "Send change link"}</button></div></section>

    <section className="settings-section" aria-labelledby="data-settings"><header><span><Database /></span><div><h2 id="data-settings">Data &amp; account</h2><p>Download your records or permanently remove your account.</p></div></header>
      <div className="settings-export-grid">{(["sales", "stock", "loans", "documents"] as const).map((kind) => <button type="button" disabled={!!busy} key={kind} onClick={() => void exportData(kind)}><Download /><span><strong>Export {kind}</strong><small>Download JSON</small></span></button>)}</div>
      <div className="settings-danger-row"><span><ShieldAlert /></span><div><strong>Delete account</strong><small>This permanently removes your account and cannot be undone.</small></div><button type="button" onClick={() => setDeleteOpen(true)}>Delete account</button></div>
    </section>

    {deleteOpen && <div className="settings-dialog-backdrop"><div className="settings-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><ShieldAlert /><h3 id="delete-account-title">Delete your account?</h3><p>Your account and any business data owned only by this account will be permanently removed.</p><div><button type="button" onClick={() => setDeleteOpen(false)}>Cancel</button><button className="danger" type="button" disabled={busy === "delete"} onClick={() => void deleteAccount()}>{busy === "delete" ? "Deleting…" : "Delete permanently"}</button></div></div></div>}
  </div>;
}
