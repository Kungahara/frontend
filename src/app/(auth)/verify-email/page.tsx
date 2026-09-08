import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { VerifyEmail } from "@/components/email-verification";
import { FormLoading } from "@/components/form-loading";
export default function VerifyEmailPage() { return <AuthShell mode="signup"><Suspense fallback={<FormLoading message="verifying" />}><VerifyEmail /></Suspense></AuthShell>; }
