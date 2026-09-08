import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShellWithBackdrop } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { FormLoading } from "@/components/form-loading";

export const metadata: Metadata = { title: "Sign in" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ backdropSection?: string; backdropY?: string }> }) {
  const query = await searchParams;
  return <AuthShellWithBackdrop mode="login" backdropSection={query.backdropSection} backdropY={Number(query.backdropY)}><Suspense fallback={<FormLoading message="preparingSignIn" />}><LoginForm /></Suspense></AuthShellWithBackdrop>;
}
