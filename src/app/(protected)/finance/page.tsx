import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { FinanceOverview } from "@/components/finance-overview";

export async function generateMetadata(): Promise<Metadata> { return { title: await getLocale() === "fr" ? "Finances" : "Finance" }; }

export default function FinancePage() {
  return <section className="stock-data-body sales-page finance-page" aria-label="Finance data area"><FinanceOverview /></section>;
}
