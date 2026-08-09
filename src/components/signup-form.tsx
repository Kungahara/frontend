"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authRequest } from "@/lib/api/client";
import { OAuthButtons } from "./oauth-buttons";

export function SignupForm() {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false); const [showConfirm, setShowConfirm] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = event.currentTarget; const data = new FormData(form);
    const password = String(data.get("password")); const confirmPassword = String(data.get("confirmPassword"));
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      // confirmPassword is intentionally excluded: it is frontend validation only.
      await authRequest("signup", { method: "POST", body: JSON.stringify({ firstName: data.get("firstName"), lastName: data.get("lastName"), email: data.get("email"), password, businessName: data.get("businessName") }) });
      router.replace(`/verify-email-sent?email=${encodeURIComponent(String(data.get("email")))}`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create account."); setBusy(false); }
  }
  return <>
    <header className="form-heading"><p className="eyebrow">Join Kungahara</p><h1>Join Us</h1><p>Create your account and start your journey.</p></header>
    <form className="auth-form compact" onSubmit={submit}>
      <div className="field-row"><label>First name<input name="firstName" autoComplete="given-name" required /></label><label>Last name<input name="lastName" autoComplete="family-name" required /></label></div>
      <label>Business name<input name="businessName" autoComplete="organization" placeholder="e.g. Uwera Foods" required /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <div className="field-row">
        <label>Password<span className="password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label>
        <label>Confirm password<span className="password-wrap"><input name="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" minLength={8} required /><button type="button" aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirm} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label>
      </div>
      <p className="field-hint">Use at least 8 characters and avoid common passwords.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="submit-button" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
    </form>
    <div className="divider"><span>or sign up with</span></div><OAuthButtons mode="signup" />
    <div className="post-oauth">
      <p className="switch-auth">Already have an account? <Link href="/login">Sign in</Link></p>
      <p className="legal-copy">By signing up, you agree to Kungahara&apos;s <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
    </div>
  </>;
}
