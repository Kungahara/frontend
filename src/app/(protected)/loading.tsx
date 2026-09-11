"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { AppPageSkeleton } from "@/components/app-page-skeleton";

export default function ProtectedLoading() {
  const t = useTranslations("Shell");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!["dashboard", "stock", "sales", "finance", "documents", "settings", "help"].includes(segment)) return <div className="route-loading-screen route-loading-fallback" role="status" aria-live="polite"><span className="route-loading-spinner" aria-hidden="true" /><strong>{t("loadingPage")}</strong><small>{t("waitMoment")}</small></div>;
  const variant = segment === "sales" && searchParams.get("view") === "analytics" ? "sales-analytics" : segment as "dashboard" | "stock" | "sales" | "finance" | "documents" | "settings" | "help";
  return <AppPageSkeleton variant={variant} label={t("loadingPage")} />;
}
