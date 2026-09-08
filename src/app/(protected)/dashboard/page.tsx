import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { DashboardSummaryCards } from "@/components/dashboard-summary-cards";

export async function generateMetadata(): Promise<Metadata> { return { title: await getLocale() === "fr" ? "Tableau de bord" : "Dashboard" }; }

export default function DashboardPage() {
  return <DashboardSummaryCards />;
}
