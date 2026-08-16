import type { Metadata } from "next";
import { FinanceOverview } from "@/components/finance-overview";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  return <section className="stock-data-body sales-page finance-page" aria-label="Finance data area"><FinanceOverview /></section>;
}
