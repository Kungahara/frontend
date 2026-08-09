"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authRequest } from "@/lib/api/client";
import { OAuthButtons } from "./oauth-buttons";

export function LoginForm() {
  const router = useRouter(); const params = useSearchParams();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [show, setShow] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      await authRequest("login", { method: "POST", body: JSON.stringify({ email: data.get("email"), password: data.get("password"), rememberMe: data.get("rememberMe") === "on" }) });
      const next = params.get("next"); router.replace(next?.startsWith("/") ? next : "/dashboard"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in."); setBusy(false); }
  }
  return <>
    <header className="form-heading"><p className="eyebrow">Secure access</p><h1>Welcome back</h1><p>Sign in to continue growing your business.</p></header>
    <form className="auth-form" onSubmit={submit}>
      <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>Password<span className="password-wrap"><input name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Password" required /><button type="button" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)}>{show ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label>
      <div className="login-options"><label className="remember-choice"><input name="rememberMe" type="checkbox" /><span>Remember me</span></label><Link href="/forgot-password">Forgot password?</Link></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="submit-button" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
    <div className="divider"><span>or continue with</span></div><OAuthButtons mode="login" />
    <p className="switch-auth after-oauth">New to Kungahara? <Link href="/signup">Create an account</Link></p>
  </>;
}
