import type { Metadata } from "next";

import { HelpContent } from "@/components/help-content";

export const metadata: Metadata = { title: "Help" };

export default function HelpPage() {
  return <HelpContent />;
}
