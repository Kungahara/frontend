import type { Metadata } from "next";

import { SalesOverview } from "@/components/sales-overview";

export const metadata: Metadata = { title: "Sales" };

export default function SalesPage() {
  return <section className="stock-data-body sales-page" aria-label="Sales data area">
    <SalesOverview />
  </section>;
}
