"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { inventoryFetch } from "@/lib/inventory-client";

export function ReportSettings() {
  const [schedule, setSchedule] = useState({ enabled: false, time: "18:00", timezone: "Africa/Kigali" });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    inventoryFetch("/api/notifications/report-schedule", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load report schedule.");
      const body = await response.json();
      if (active) { setSchedule(body); setReady(true); }
    }).catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [loadAttempt]);
  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await inventoryFetch("/api/notifications/report-schedule", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(schedule) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Unable to save report schedule.");
      setSchedule(body); setMessage("Report schedule saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
    finally { setBusy(false); }
  }
  return <section className="settings-section settings-report-section"><header><span><FileText aria-hidden="true" /></span><div><h2>Daily member reports</h2><p>One PDF with a section for every member, covering the previous 24 hours.</p></div></header>
    <form className="settings-form-grid settings-report-schedule" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <div className="settings-report-toggle"><span>Daily reports</span><button className={`settings-switch${schedule.enabled ? " active" : ""}`} type="button" role="switch" aria-label="Daily reports" aria-checked={schedule.enabled} disabled={!ready || busy} onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}><span /></button></div>
      <label>Report time<input required type="time" disabled={!ready || busy} value={schedule.time} onChange={(event) => setSchedule({ ...schedule, time: event.target.value })} /></label>
      <label>Time zone<input required disabled={!ready || busy} value={schedule.timezone} onChange={(event) => setSchedule({ ...schedule, timezone: event.target.value })} placeholder="Africa/Kigali" /></label>
      <button className="settings-primary-button" disabled={!ready || busy}>{busy ? "Saving…" : "Save report schedule"}</button>
    </form>{message && <p className="settings-report-message" role="status">{message}{!ready && <button className="settings-secondary-button" type="button" onClick={() => { setMessage(""); setLoadAttempt((attempt) => attempt + 1); }}>Try again</button>}</p>}
  </section>;
}
