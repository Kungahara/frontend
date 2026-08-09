"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authRequest } from "@/lib/api/client";

function OAuthCallback() {
  const { provider } = useParams<{ provider: string }>(); const search = useSearchParams(); const router = useRouter();
  const [message, setMessage] = useState("Completing your secure sign in…");
  useEffect(() => {
    const code = search.get("code"), state = search.get("state"), expected = sessionStorage.getItem(`oauth_state_${provider}`);
    if (!code || !state || state !== expected || !["google", "microsoft"].includes(provider)) { setMessage("This sign-in request is invalid or expired."); return; }
    sessionStorage.removeItem(`oauth_state_${provider}`);
    authRequest(`oauth/${provider}`, { method: "POST", body: JSON.stringify({ code, redirectUri: `${window.location.origin}/auth/${provider}/callback` }) })
      .then(() => { router.replace("/dashboard"); router.refresh(); })
      .catch((error) => setMessage(error instanceof Error ? error.message : "OAuth sign-in failed."));
  }, [provider, router, search]);
  return <main className="callback-page"><div className="callback-card"><span className="callback-spinner" /><h1>Kungahara</h1><p>{message}</p></div></main>;
}

export default function OAuthCallbackPage() {
  return <Suspense fallback={<main className="callback-page"><div className="callback-card"><p>Preparing secure sign in…</p></div></main>}><OAuthCallback /></Suspense>;
}
