import type { Metadata } from "next";

import { ProtectedPlaceholder } from "@/components/protected-placeholder";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return <ProtectedPlaceholder eyebrow="Support" title="Help" description="Guides and support for using your Kungahara workspace will be available here." />;
}
