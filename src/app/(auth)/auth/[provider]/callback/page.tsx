"use client";

import Link from "next/link";
import { CircleAlert, ShieldCheck } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { authRequest } from "@/lib/api/client";

function CallbackStatus({ message, failed = false }: { message: string; failed?: boolean }) {
  return <main className="callback-page">
    <div className={`callback-card${failed ? " callback-card-failed" : ""}`}>
      <Brand />
      <div className="callback-status-icon" aria-hidden="true">
        {failed ? <CircleAlert /> : <><ShieldCheck /><span className="callback-spinner" /></>}
      </div>
      <p className="callback-eyebrow">Secure sign in</p>
      <h1>{failed ? "Unable to sign in" : "Signing you in"}</h1>
      <p className="callback-message">{message}</p>
      {failed && <Link className="callback-action" href="/login">Back to sign in</Link>}
    </div>
  </main>;
}

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
    const showFailure = (failureMessage: string) => queueMicrotask(() => {
      setFailed(true);
      setMessage(failureMessage);
    });
    if (!state || state !== expected || !["google", "microsoft"].includes(provider)) {
      showFailure("This sign-in request is invalid or expired. Please start again."); return;
    }
    sessionStorage.removeItem(`oauth_state_${provider}`);
    if (oauthError) {
      showFailure(oauthError === "access_denied"
        ? `${provider === "google" ? "Google" : "Microsoft"} sign-in was cancelled or permission was denied.`
        : "The sign-in provider could not authorize this request.");
      return;
    }
    if (!code) { showFailure("The sign-in provider did not return an authorization code. Please try again."); return; }
    authRequest(`oauth/${provider}`, { method: "POST", body: JSON.stringify({ code, redirectUri: `${window.location.origin}/auth/${provider}/callback` }) })
      .then(() => { router.replace("/dashboard"); router.refresh(); })
      .catch((error) => { setFailed(true); setMessage(error instanceof Error ? error.message : "OAuth sign-in failed."); });
  }, [provider, router, search]);
  return <CallbackStatus message={message} failed={failed} />;
}

export default function OAuthCallbackPage() {
  return <Suspense fallback={<CallbackStatus message="Preparing secure sign in…" />}><OAuthCallback /></Suspense>;
}
