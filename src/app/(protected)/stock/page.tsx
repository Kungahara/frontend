import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { StockOverview } from "@/components/stock-overview";

export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); return { title: locale === "fr" ? "Inventaire" : locale === "rw" ? "Ububiko" : "Stock" }; }

export default async function StockPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  return <section className="stock-data-body stock-page" aria-label="Stock data area">
    <StockOverview initialView={view === "analysis" ? "analysis" : "products"} />
  </section>;
}
