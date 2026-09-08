import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { SettingsContent } from "@/components/settings-content";

export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); return { title: locale === "fr" ? "Paramètres" : locale === "rw" ? "Igenamiterere" : "Settings" }; }

export default function SettingsPage() {
  return <SettingsContent />;
}
