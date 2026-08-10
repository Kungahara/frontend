"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { authRequest } from "@/lib/api/client";

function OAuthCallback() {
  const { provider } = useParams<{ provider: string }>(); const search = useSearchParams(); const router = useRouter();
  const [message, setMessage] = useState("Completing your secure sign in…");
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  useEffect(() => {
    // React Strict Mode runs effects twice in development. OAuth codes and
    // state values are single-use, so only the first invocation may consume them.
    if (started.current) return;
    started.current = true;
    const code = search.get("code"), state = search.get("state"), oauthError = search.get("error");
    const expected = sessionStorage.getItem(`oauth_state_${provider}`);
    if (!state || state !== expected || !["google", "microsoft"].includes(provider)) {
      setFailed(true); setMessage("This sign-in request is invalid or expired. Please start again."); return;
    }
    sessionStorage.removeItem(`oauth_state_${provider}`);
    if (oauthError) {
      setFailed(true);
      setMessage(oauthError === "access_denied"
        ? `${provider === "google" ? "Google" : "Microsoft"} sign-in was cancelled or permission was denied.`
        : "The sign-in provider could not authorize this request.");
      return;
    }
    if (!code) { setFailed(true); setMessage("The sign-in provider did not return an authorization code. Please try again."); return; }
    authRequest(`oauth/${provider}`, { method: "POST", body: JSON.stringify({ code, redirectUri: `${window.location.origin}/auth/${provider}/callback` }) })
      .then(() => { router.replace("/dashboard"); router.refresh(); })
      .catch((error) => { setFailed(true); setMessage(error instanceof Error ? error.message : "OAuth sign-in failed."); });
  }, [provider, router, search]);
  return <main className="callback-page"><div className="callback-card">{!failed && <span className="callback-spinner" />}<h1>Kungahara</h1><p>{message}</p>{failed && <Link className="text-link" href="/login">Back to sign in</Link>}</div></main>;
}

export default function OAuthCallbackPage() {
  return <Suspense fallback={<main className="callback-page"><div className="callback-card"><p>Preparing secure sign in…</p></div></main>}><OAuthCallback /></Suspense>;
}
