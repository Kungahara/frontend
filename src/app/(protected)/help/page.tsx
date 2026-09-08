import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { HelpContent } from "@/components/help-content";

export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); return { title: locale === "fr" ? "Aide" : locale === "rw" ? "Ubufasha" : "Help" }; }

export default function HelpPage() {
  return <HelpContent />;
}
