"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ApiError, authRequest } from "@/lib/api/client";
import { markSessionActivity } from "@/lib/session-activity";
import { OAuthButtons } from "./oauth-buttons";

export function LoginForm() {
  const commonText = useTranslations("Common");
  const t = useTranslations("Auth");
  const router = useRouter(); const params = useSearchParams();
  const inactivityMessage = params.get("reason") === "inactive" ? t("inactive") : "";
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [show, setShow] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    try {
      await authRequest("login", { method: "POST", body: JSON.stringify({ email, password: data.get("password"), rememberMe: data.get("rememberMe") === "on" }) });
      markSessionActivity();
      const next = params.get("next"); router.replace(next?.startsWith("/") ? next : "/dashboard"); router.refresh();
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "email_not_verified") {
        try {
          await authRequest("resend-verification", { method: "POST", body: JSON.stringify({ email }) });
          router.push(`/verify-email-sent?email=${encodeURIComponent(email)}&sent=1`);
        } catch {
          router.push(`/verify-email-sent?email=${encodeURIComponent(email)}&sendFailed=1`);
        }
        return;
      }
      setError(reason instanceof Error ? reason.message : t("unableSignIn")); setBusy(false);
    }
  }
  return <>
    <header className="form-heading"><p className="eyebrow">{t("secureAccess")}</p><h1>{t("welcomeBack")}</h1><p>{t("signInIntro")}</p></header>
    <form className="auth-form" onSubmit={submit}>
      {inactivityMessage && <p className="form-success" role="status">{inactivityMessage}</p>}
      <label>{t("email")}<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>{t("password")}<span className="password-wrap"><input name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder={t("password")} required /><button type="button" aria-label={show ? t("hidePassword") : t("showPassword")} aria-pressed={show} onClick={() => setShow(!show)}>{show ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label>
      <div className="login-options"><label className="remember-choice"><input name="rememberMe" type="checkbox" /><span>{t("rememberMe")}</span></label><Link href="/forgot-password">{t("forgotPassword")}</Link></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="submit-button" disabled={busy}>{busy ? commonText("signingIn") : t("signIn")}</button>
    </form>
    <div className="divider"><span>{t("orContinueWith")}</span></div><OAuthButtons mode="login" />
    <p className="switch-auth after-oauth">{t("newToKungahara")} <Link href="/signup">{t("createAccount")}</Link></p>
  </>;
}
