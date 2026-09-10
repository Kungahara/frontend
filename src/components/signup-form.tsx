"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { authRequest } from "@/lib/api/client";
import { OAuthButtons } from "./oauth-buttons";

export function SignupForm() {
  const t = useTranslations("Auth");
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false); const [showConfirm, setShowConfirm] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = event.currentTarget; const data = new FormData(form);
    const password = String(data.get("password")); const confirmPassword = String(data.get("confirmPassword"));
    if (password !== confirmPassword) { setError(t("passwordsDoNotMatch")); return; }
    setBusy(true);
    try {
      // confirmPassword is intentionally excluded: it is frontend validation only.
      await authRequest("signup", { method: "POST", body: JSON.stringify({ firstName: data.get("firstName"), lastName: data.get("lastName"), email: data.get("email"), password, businessName: data.get("businessName") }) });
      router.replace(`/verify-email-sent?email=${encodeURIComponent(String(data.get("email")))}`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("unableCreateAccount")); setBusy(false); }
  }
  return <>
    <header className="form-heading"><p className="eyebrow">{t("joinKungahara")}</p><h1>{t("joinUs")}</h1><p>{t("signupIntro")}</p></header>
    <form className="auth-form compact" onSubmit={submit}>
      <div className="field-row"><label>{t("firstName")}<input name="firstName" autoComplete="given-name" required /></label><label>{t("lastName")}<input name="lastName" autoComplete="family-name" required /></label></div>
      <label>{t("businessName")}<input name="businessName" autoComplete="organization" placeholder={t("businessExample")} required /></label>
      <label>{t("email")}<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <div className="field-row">
        <label>{t("password")}<span className="password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required /><button type="button" aria-label={showPassword ? t("hidePassword") : t("showPassword")} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label>
        <label>{t("confirmPassword")}<span className="password-wrap"><input name="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" minLength={8} required /><button type="button" aria-label={showConfirm ? t("hideConfirmPassword") : t("showConfirmPassword")} aria-pressed={showConfirm} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label>
      </div>
      <p className="field-hint">{t("passwordHint")}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="submit-button" disabled={busy}>{busy ? t("creatingAccount") : t("createAccount")}</button>
    </form>
    <div className="divider"><span>{t("orSignUpWith")}</span></div><OAuthButtons mode="signup" />
    <div className="post-oauth">
      <p className="switch-auth">{t("alreadyAccount")} <Link href="/login">{t("signIn")}</Link></p>
      <p className="legal-copy">{t("agreementPrefix")} <Link href="/terms">{t("terms")}</Link> {t("and")} <Link href="/privacy">{t("privacy")}</Link>.</p>
    </div>
  </>;
}
