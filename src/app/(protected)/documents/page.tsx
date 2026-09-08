import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { DocumentsOverview } from "@/components/documents-overview";

export async function generateMetadata(): Promise<Metadata> { return { title: await getLocale() === "fr" ? "Mes documents" : "Your Docs" }; }

export default function DocumentsPage() {
  return <section className="stock-data-body sales-page documents-page" aria-label="Documents data area"><DocumentsOverview /></section>;
}
