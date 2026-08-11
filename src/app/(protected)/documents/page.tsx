import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your Docs" };

export default function DocumentsPage() {
  return <section className="stock-data-body" aria-label="Documents data area" />;
}
