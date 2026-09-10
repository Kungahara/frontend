"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

type Provider = "google" | "microsoft";

const config = {
  google: {
    label: "Google", clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "openid email profile",
  },
  microsoft: {
    label: "Microsoft", clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
    authorize: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scope: "openid email profile",
  },
};

export function OAuthButtons({ mode }: { mode: "login" | "signup" }) {
  const t = useTranslations("Auth");
  function start(provider: Provider) {
    const item = config[provider];
    if (!item.clientId) return;
    const state = crypto.randomUUID();
    sessionStorage.setItem(`oauth_state_${provider}`, state);
    const redirectUri = `${window.location.origin}/auth/${provider}/callback`;
    const params = new URLSearchParams({ client_id: item.clientId, redirect_uri: redirectUri, response_type: "code", scope: item.scope, state });
    if (provider === "google") params.set("access_type", "online");
    window.location.assign(`${item.authorize}?${params}`);
  }

  return <div className={`oauth-grid ${mode}`}>
    {(["google", "microsoft"] as Provider[]).map((provider) => <button className="oauth-button" type="button" aria-label={t(mode === "login" ? "continueWith" : "signUpWith", { provider: config[provider].label })} key={provider} disabled={!config[provider].clientId} onClick={() => start(provider)}>
      <Image className="provider-mark" src={provider === "google" ? "/google-g.png" : "/microsoft-logo.png"} width={18} height={18} alt="" />
      <span className="oauth-button-label">{t(mode === "login" ? "continueWith" : "signUpWith", { provider: config[provider].label })}</span>
    </button>)}
  </div>;
}
