import type { Metadata } from "next";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  return <section className="stock-data-body" aria-label="Finance data area" />;
}
