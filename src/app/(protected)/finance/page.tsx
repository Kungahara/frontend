import { redirect } from "next/navigation";
import { backendRequest, tokenCookies } from "@/lib/auth-server";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { FinanceOverview } from "@/components/finance-overview";

export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); return { title: locale === "fr" ? "Finances" : locale === "rw" ? "Imari" : "Finance" }; }

export default async function FinancePage() {
  const { access } = await tokenCookies();
  if (!access) redirect("/login");
  const response = await backendRequest("auth/me/", { headers: { Authorization: `Bearer ${access}` } });
  const body = await response.json();
  if (!response.ok || body.user?.role !== "owner") redirect("/dashboard");
  return <section className="stock-data-body sales-page finance-page" aria-label="Finance data area"><FinanceOverview /></section>;
}
