import type { Metadata } from "next";

import { SalesOverview } from "@/components/sales-overview";

export const metadata: Metadata = { title: "Sales" };

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const initialView = view === "analytics" || view === "history" ? view : "today";
  return <section className="stock-data-body sales-page" aria-label="Sales data area">
    <SalesOverview initialView={initialView} />
  </section>;
}
