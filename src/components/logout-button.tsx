"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { authRequest } from "@/lib/api/client";
import { clearSessionActivity } from "@/lib/session-activity";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  redirectTo?: string;
  showIcon?: boolean;
};

export function LogoutButton({ className = "logout-button", label, redirectTo = "/login", showIcon = false }: LogoutButtonProps) {
  const router = useRouter();
  const t = useTranslations("Common");
  const [busy, setBusy] = useState(false);

  return <button className={className} disabled={busy} onClick={async () => {
    setBusy(true);
    await authRequest("logout", { method: "POST", body: "{}" }).catch(() => null);
    clearSessionActivity();
    router.replace(redirectTo);
    router.refresh();
  }}>{showIcon && <LogOut aria-hidden="true" />}<span>{busy ? t("signingOut") : label ?? t("signOut")}</span></button>;
}
