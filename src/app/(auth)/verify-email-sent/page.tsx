import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { VerificationSent } from "@/components/email-verification";
export default function VerificationSentPage() { return <AuthShell mode="signup"><Suspense fallback={<p className="form-loading">Preparing…</p>}><VerificationSent /></Suspense></AuthShell>; }
