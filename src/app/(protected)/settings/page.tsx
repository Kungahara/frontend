import type { Metadata } from "next";

import { ProtectedPlaceholder } from "@/components/protected-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ProtectedPlaceholder
      eyebrow="Protected page"
      title="Settings"
      description="Account preferences and application controls will be added here as the product grows."
    />
  );
}
