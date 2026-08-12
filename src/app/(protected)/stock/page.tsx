import type { Metadata } from "next";

import { StockSummaryCard } from "@/components/stock-summary-card";

export const metadata: Metadata = { title: "Stock" };

export default function StockPage() {
  return <section className="stock-data-body stock-page" aria-label="Stock data area">
    <StockSummaryCard />
  </section>;
}
