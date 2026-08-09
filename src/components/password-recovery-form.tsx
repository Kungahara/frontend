"use client";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { authRequest } from "@/lib/api/client";

export function PasswordRecoveryForm({ reset = false }: { reset?: boolean }) {
  const search = useSearchParams(); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [busy, setBusy] = useState(false); const [show, setShow] = useState(false); const [showConfirm, setShowConfirm] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); const data = new FormData(event.currentTarget); setBusy(true);
    try {
      if (reset) {
        const password = String(data.get("password")), confirm = String(data.get("confirmPassword"));
        if (password !== confirm) throw new Error("Passwords do not match.");
        const result = await authRequest<{ message: string }>("reset-password", { method: "POST", body: JSON.stringify({ token: search.get("token"), password }) }); setMessage(result.message);
      } else {
        const result = await authRequest<{ message: string }>("forgot-password", { method: "POST", body: JSON.stringify({ email: data.get("email") }) }); setMessage(result.message);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The request could not be completed."); }
    setBusy(false);
  }
  return <><header className="form-heading"><h1>{reset ? "Choose a new password" : "Forgot password?"}</h1><p>{reset ? "Use a strong password you have not used before." : "Enter your email and we’ll send a secure reset link."}</p></header>
    <form className="auth-form recovery-form" onSubmit={submit}>
      {reset ? <><label>New password<span className="password-wrap"><input name="password" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} required /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label><label>Confirm new password<span className="password-wrap"><input name="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" minLength={8} required /><button type="button" aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label></> : <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>}
      {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
      <button className="submit-button" disabled={busy}>{busy ? "Please wait…" : reset ? "Reset password" : "Send reset link"}</button>
    </form><p className="switch-auth recovery-link"><Link href="/login">Back to sign in</Link></p></>;
}
