import type { Metadata } from "next";

import { StockOverview } from "@/components/stock-overview";

export const metadata: Metadata = { title: "Stock" };

export default function StockPage() {
  return <section className="stock-data-body stock-page" aria-label="Stock data area">
    <StockOverview />
  </section>;
}
