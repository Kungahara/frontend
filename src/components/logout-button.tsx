"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authRequest } from "@/lib/api/client";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  redirectTo?: string;
  showIcon?: boolean;
};

export function LogoutButton({ className = "logout-button", label = "Sign out", redirectTo = "/login", showIcon = false }: LogoutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return <button className={className} disabled={busy} onClick={async () => {
    setBusy(true);
    await authRequest("logout", { method: "POST", body: "{}" }).catch(() => null);
    router.replace(redirectTo);
    router.refresh();
  }}>{showIcon && <LogOut aria-hidden="true" />}<span>{busy ? "Signing out…" : label}</span></button>;
}
