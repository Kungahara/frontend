import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";
export default function ForgotPasswordPage() { return <AuthShell mode="login"><Suspense fallback={<p className="form-loading">Preparing recovery…</p>}><PasswordRecoveryForm /></Suspense></AuthShell>; }
