import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { DashboardSummaryCards } from "@/components/dashboard-summary-cards";

export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); return { title: locale === "fr" ? "Tableau de bord" : locale === "rw" ? "Ahabanza" : "Dashboard" }; }

export default function DashboardPage() {
  return <DashboardSummaryCards />;
}
