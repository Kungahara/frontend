import type { Metadata } from "next";

export const metadata: Metadata = { title: "Stock" };

export default function StockPage() {
  return <section className="stock-data-body" aria-label="Stock data area" />;
}
