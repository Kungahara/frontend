"use client";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { authRequest } from "@/lib/api/client";

export function VerificationSent() {
  const search = useSearchParams(); const initialEmail = search.get("email") ?? "";
  const [message, setMessage] = useState(() => search.get("sent") === "1" ? "A fresh verification email has been sent. Check your inbox and spam folder." : "");
  const [error, setError] = useState(() => search.get("sendFailed") === "1" ? "The email could not be sent automatically. Use the button below to try again." : "");
  const [busy, setBusy] = useState(false);
  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await authRequest<{ message: string }>("resend-verification", { method: "POST", body: JSON.stringify({ email: data.get("email") }) });
      setMessage(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to resend the verification email.");
    } finally { setBusy(false); }
  }
  return <><header className="verification-heading"><MailCheck aria-hidden="true" /><h1>Check your email</h1><p>Verify your email before you can enter your Kungahara workspace.</p></header><form className="auth-form" onSubmit={resend}><label>Email address<input name="email" type="email" autoComplete="email" defaultValue={initialEmail} required /></label>{message && <p className="form-success">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="submit-button" disabled={busy}>{busy ? "Sending…" : "Resend verification email"}</button></form><p className="switch-auth recovery-link"><Link href="/login">Back to sign in</Link></p></>;
}

export function VerifyEmail() {
  const search = useSearchParams(); const router = useRouter(); const started = useRef(false); const token = search.get("token");
  const [error, setError] = useState(() => token ? "" : "This verification link is incomplete.");
  useEffect(() => { if (started.current || !token) return; started.current = true; authRequest("verify-email", { method: "POST", body: JSON.stringify({ token }) }).then(() => { router.replace("/dashboard"); router.refresh(); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Verification failed.")); }, [router, token]);
  return <div className="verification-heading"><MailCheck aria-hidden="true" /><h1>{error ? "Unable to verify" : "Verifying your email"}</h1><p>{error || "Please wait while we securely activate your account…"}</p>{error && <Link className="text-link" href="/verify-email-sent">Request a new link</Link>}</div>;
}
