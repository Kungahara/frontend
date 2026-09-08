import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { VerificationSent } from "@/components/email-verification";
import { FormLoading } from "@/components/form-loading";
export default function VerificationSentPage() { return <AuthShell mode="signup"><Suspense fallback={<FormLoading message="preparing" />}><VerificationSent /></Suspense></AuthShell>; }
