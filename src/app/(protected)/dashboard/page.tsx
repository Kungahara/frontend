import type { Metadata } from "next";

import { ProtectedPlaceholder } from "@/components/protected-placeholder";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <ProtectedPlaceholder
      eyebrow="Protected page"
      title="Dashboard"
      description="Your operational overview will live here once the first product workflows are defined."
    />
  );
}
