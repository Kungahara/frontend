import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShellWithBackdrop } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Sign in" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ backdropSection?: string; backdropY?: string }> }) {
  const query = await searchParams;
  return <AuthShellWithBackdrop mode="login" backdropSection={query.backdropSection} backdropY={Number(query.backdropY)}><Suspense fallback={<p className="form-loading">Preparing sign in…</p>}><LoginForm /></Suspense></AuthShellWithBackdrop>;
}
