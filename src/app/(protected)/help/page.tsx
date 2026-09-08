import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { HelpContent } from "@/components/help-content";

export async function generateMetadata(): Promise<Metadata> { return { title: await getLocale() === "fr" ? "Aide" : "Help" }; }

export default function HelpPage() {
  return <HelpContent />;
}
