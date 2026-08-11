import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sales" };

export default function SalesPage() {
  return <section className="stock-data-body" aria-label="Sales data area" />;
}
