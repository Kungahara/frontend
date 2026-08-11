import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <section className="stock-data-body" aria-label="Dashboard data area" />;
}
