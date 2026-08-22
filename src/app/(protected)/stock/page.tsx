import type { Metadata } from "next";

import { StockOverview } from "@/components/stock-overview";

export const metadata: Metadata = { title: "Stock" };

export default async function StockPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  return <section className="stock-data-body stock-page" aria-label="Stock data area">
    <StockOverview initialView={view === "analysis" ? "analysis" : "products"} />
  </section>;
}
