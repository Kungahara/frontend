"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { apiErrorMessage } from "@/lib/api/client";
import { landingText, type LandingLanguage } from "@/lib/landing-copy";

export function MarketingContactForm({ language }: { language: LandingLanguage }) {
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
      if (!response.ok) throw new Error(apiErrorMessage(body, landingText("Unable to send your message.", language)));
      setSuccess(landingText(body?.message ?? "Your message was sent to Kungahara support.", language));
      form.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : landingText("Unable to send your message.", language));
    } finally {
      setBusy(false);
    }
  }

  return <form className="marketing-contact-form" onSubmit={submit}>
    <div><label htmlFor="contact-first-name">{landingText("First name", language)}</label><input id="contact-first-name" name="firstName" autoComplete="given-name" maxLength={100} required placeholder={landingText("Enter your first name", language)} /></div>
    <div><label htmlFor="contact-last-name">{landingText("Last name", language)}</label><input id="contact-last-name" name="lastName" autoComplete="family-name" maxLength={100} required placeholder={landingText("Enter your last name", language)} /></div>
    <div><label htmlFor="contact-email">{landingText("Email address", language)}</label><input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" /></div>
    <div><label htmlFor="contact-business">{landingText("Business name", language)}</label><input id="contact-business" name="business" autoComplete="organization" maxLength={200} placeholder={landingText("Enter your business name", language)} /></div>
    <div><label htmlFor="contact-message">{landingText("How can we help?", language)}</label><textarea id="contact-message" name="message" rows={4} maxLength={1000} required placeholder={landingText("Tell us what you need", language)} /></div>
    <div className="marketing-contact-honeypot" aria-hidden="true"><label htmlFor="contact-website">{landingText("Website", language)}</label><input id="contact-website" name="website" tabIndex={-1} autoComplete="off" /></div>
    {(success || error) && <p className={`marketing-contact-feedback${error ? " error" : ""}`} role={error ? "alert" : "status"}>{error || success}</p>}
    <button type="submit" disabled={busy}>{busy ? commonText("sending") : landingText("Send message", language)}<Send aria-hidden="true" /></button>
  </form>;
}
