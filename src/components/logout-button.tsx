"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authRequest } from "@/lib/api/client";
export function LogoutButton() { const router = useRouter(); const [busy, setBusy] = useState(false); return <button className="logout-button" disabled={busy} onClick={async () => { setBusy(true); await authRequest("logout", { method: "POST", body: "{}" }).catch(() => null); router.replace("/login"); router.refresh(); }}>{busy ? "Signing out…" : "Sign out"}</button>; }
