"use client";

import { useTranslations } from "next-intl";

export default function ProtectedLoading() {
  const t = useTranslations("Shell");
  return <div className="route-loading-screen route-loading-fallback" role="status" aria-live="polite">
    <span className="route-loading-spinner" aria-hidden="true" />
    <strong>{t("loadingPage")}</strong>
    <small>{t("waitMoment")}</small>
  </div>;
}
