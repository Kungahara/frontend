import type { Metadata } from "next";
import { AuthShellWithBackdrop } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "Create account" };
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ backdropSection?: string; backdropY?: string }> }) {
  const query = await searchParams;
  return <AuthShellWithBackdrop mode="signup" backdropSection={query.backdropSection} backdropY={Number(query.backdropY)}><SignupForm /></AuthShellWithBackdrop>;
}
