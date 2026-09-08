"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { apiErrorMessage } from "@/lib/api/client";

export function MarketingContactForm() {
  const commonText = useTranslations("Common");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setSuccess("");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/public-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "Unable to send your message."));
      setSuccess(body?.message ?? "Your message was sent to Kungahara support.");
      form.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send your message.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="marketing-contact-form" onSubmit={submit}>
    <div><label htmlFor="contact-first-name">First name</label><input id="contact-first-name" name="firstName" autoComplete="given-name" maxLength={100} required placeholder="Enter your first name" /></div>
    <div><label htmlFor="contact-last-name">Last name</label><input id="contact-last-name" name="lastName" autoComplete="family-name" maxLength={100} required placeholder="Enter your last name" /></div>
    <div><label htmlFor="contact-email">Email address</label><input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" /></div>
    <div><label htmlFor="contact-business">Business name</label><input id="contact-business" name="business" autoComplete="organization" maxLength={200} placeholder="Enter your business name" /></div>
    <div><label htmlFor="contact-message">How can we help?</label><textarea id="contact-message" name="message" rows={4} maxLength={1000} required placeholder="Tell us what you need" /></div>
    <div className="marketing-contact-honeypot" aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" name="website" tabIndex={-1} autoComplete="off" /></div>
    {(success || error) && <p className={`marketing-contact-feedback${error ? " error" : ""}`} role={error ? "alert" : "status"}>{error || success}</p>}
    <button type="submit" disabled={busy}>{busy ? commonText("sending") : "Send message"}<Send aria-hidden="true" /></button>
  </form>;
}
