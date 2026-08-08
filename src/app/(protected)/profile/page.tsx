import type { Metadata } from "next";

import { ProtectedPlaceholder } from "@/components/protected-placeholder";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <ProtectedPlaceholder
      eyebrow="Protected page"
      title="Profile"
      description="Identity, contact, and organization details will be managed from this space."
    />
  );
}
