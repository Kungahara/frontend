import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";
export default function ResetPasswordPage() { return <AuthShell mode="login"><Suspense fallback={<p className="form-loading">Preparing reset…</p>}><PasswordRecoveryForm reset /></Suspense></AuthShell>; }
