import type { Metadata } from "next";
import { AuthShellWithBackdrop } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: t("createAccount") };
}
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ backdropSection?: string; backdropY?: string }> }) {
  const query = await searchParams;
  return <AuthShellWithBackdrop mode="signup" backdropSection={query.backdropSection} backdropY={Number(query.backdropY)}><SignupForm /></AuthShellWithBackdrop>;
}
