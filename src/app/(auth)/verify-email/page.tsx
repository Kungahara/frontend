import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { VerifyEmail } from "@/components/email-verification";
export default function VerifyEmailPage() { return <AuthShell mode="signup"><Suspense fallback={<p className="form-loading">Verifying…</p>}><VerifyEmail /></Suspense></AuthShell>; }
