import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { SettingsContent } from "@/components/settings-content";

export async function generateMetadata(): Promise<Metadata> { return { title: await getLocale() === "fr" ? "Paramètres" : "Settings" }; }

export default function SettingsPage() {
  return <SettingsContent />;
}
