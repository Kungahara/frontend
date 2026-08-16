import type { Metadata } from "next";
import { DocumentsOverview } from "@/components/documents-overview";

export const metadata: Metadata = { title: "Your Docs" };

export default function DocumentsPage() {
  return <section className="stock-data-body sales-page documents-page" aria-label="Documents data area"><DocumentsOverview /></section>;
}
