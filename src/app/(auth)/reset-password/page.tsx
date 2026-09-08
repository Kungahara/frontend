import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";
import { FormLoading } from "@/components/form-loading";
export default function ResetPasswordPage() { return <AuthShell mode="login"><Suspense fallback={<FormLoading message="preparingReset" />}><PasswordRecoveryForm reset /></Suspense></AuthShell>; }
