import type { Metadata } from "next";

import { DashboardSummaryCards } from "@/components/dashboard-summary-cards";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <DashboardSummaryCards />;
}
