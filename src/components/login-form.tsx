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
  const router = useRouter(); const params = useSearchParams();
  const inactivityMessage = params.get("reason") === "inactive" ? "You were signed out after 2 days of inactivity. Sign in to continue." : "";
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
      setError(reason instanceof Error ? reason.message : "Unable to sign in."); setBusy(false);
    }
  }
  return <>
    <header className="form-heading"><p className="eyebrow">Secure access</p><h1>Welcome back</h1><p>Sign in to continue growing your business.</p></header>
    <form className="auth-form" onSubmit={submit}>
      {inactivityMessage && <p className="form-success" role="status">{inactivityMessage}</p>}
      <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>Password<span className="password-wrap"><input name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Password" required /><button type="button" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)}>{show ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label>
      <div className="login-options"><label className="remember-choice"><input name="rememberMe" type="checkbox" /><span>Remember me</span></label><Link href="/forgot-password">Forgot password?</Link></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="submit-button" disabled={busy}>{busy ? commonText("signingIn") : "Sign in"}</button>
    </form>
    <div className="divider"><span>or continue with</span></div><OAuthButtons mode="login" />
    <p className="switch-auth after-oauth">New to Kungahara? <Link href="/signup">Create an account</Link></p>
  </>;
}
