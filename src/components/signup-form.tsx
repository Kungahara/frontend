"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Building2, Eye, EyeOff } from "lucide-react";
import { authRequest } from "@/lib/api/client";
import { OAuthButtons } from "./oauth-buttons";

type Invitation = {
  email: string;
  role: "owner" | "member";
  status: "pending";
  businessName: string;
  expiresAt: string;
};

export function SignupForm({ invitationToken }: { invitationToken?: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [error, setError] = useState("");
  const [invitationError, setInvitationError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingInvitation, setLoadingInvitation] = useState(Boolean(invitationToken));
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [showRefusal, setShowRefusal] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const safeToLeave = useRef(false);

  useEffect(() => {
    if (!invitationToken) return;
    let active = true;
    authRequest<{ invitation: Invitation }>(`invitation?token=${encodeURIComponent(invitationToken)}`)
      .then((result) => { if (active) setInvitation(result.invitation); })
      .catch((reason) => { if (active) setInvitationError(reason instanceof Error ? reason.message : t("invitationUnavailable")); })
      .finally(() => { if (active) setLoadingInvitation(false); });
    return () => { active = false; };
  }, [invitationToken, t]);

  useEffect(() => {
    if (!invitation || !invitationToken) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (safeToLeave.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const refuseAfterLeaving = (event: PageTransitionEvent) => {
      if (safeToLeave.current || event.persisted) return;
      const payload = new Blob([JSON.stringify({ token: invitationToken })], { type: "application/json" });
      navigator.sendBeacon("/api/auth/decline-invitation", payload);
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    window.addEventListener("pagehide", refuseAfterLeaving);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      window.removeEventListener("pagehide", refuseAfterLeaving);
    };
  }, [invitation, invitationToken]);

  async function refuseInvitation() {
    if (!invitationToken) return;
    setRefusing(true);
    setError("");
    try {
      await authRequest("decline-invitation", { method: "POST", body: JSON.stringify({ token: invitationToken }) });
      safeToLeave.current = true;
      setInvitation(null);
      setShowRefusal(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("unableRefuseInvitation"));
    } finally {
      setRefusing(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password")); const confirmPassword = String(data.get("confirmPassword"));
    if (password !== confirmPassword) { setError(t("passwordsDoNotMatch")); return; }
    setBusy(true);
    safeToLeave.current = true;
    try {
      await authRequest("signup", { method: "POST", body: JSON.stringify({
        firstName: data.get("firstName"), lastName: data.get("lastName"), email: data.get("email"), password,
        businessName: data.get("businessName"), ...(invitation && invitationToken ? { invitationToken } : {}),
      }) });
      router.replace(`/verify-email-sent?email=${encodeURIComponent(String(data.get("email")))}`); router.refresh();
    } catch (reason) {
      safeToLeave.current = false;
      setError(reason instanceof Error ? reason.message : t("unableCreateAccount")); setBusy(false);
    }
  }

  if (loadingInvitation) return <div className="invitation-checking" role="status"><span aria-hidden="true" /><p>{t("checkingInvitation")}</p></div>;
  if (invitationToken && invitationError && !invitation) return <div className="invitation-unavailable" role="status"><AlertTriangle aria-hidden="true" /><h1>{t("invitationUnavailable")}</h1><p>{invitationError}</p><Link href="/signup" replace>{t("createOwnOrganization")}</Link></div>;

  return <>
    <header className="form-heading"><p className="eyebrow">{t("joinKungahara")}</p><h1>{invitation ? t("joinBusiness", { businessName: invitation.businessName }) : t("joinUs")}</h1><p>{invitation ? t("invitedSignupIntro", { businessName: invitation.businessName }) : t("signupIntro")}</p></header>
    <form className="auth-form compact" onSubmit={submit}>
      <div className="field-row"><label>{t("firstName")}<input name="firstName" autoComplete="given-name" required /></label><label>{t("lastName")}<input name="lastName" autoComplete="family-name" required /></label></div>
      <label>{t("businessName")}<span className={invitation ? "invitation-locked-field" : undefined}><input key={invitation ? "invited-business" : "new-business"} name="businessName" autoComplete="organization" placeholder={t("businessExample")} defaultValue={invitation?.businessName} readOnly={Boolean(invitation)} onClick={invitation ? () => setShowRefusal(true) : undefined} required />{invitation && <button type="button" onClick={() => setShowRefusal(true)} aria-label={t("changeInvitedBusiness")}><Building2 aria-hidden="true" /></button>}</span></label>
      <label>{t("email")}<input key={invitation ? "invited-email" : "new-email"} name="email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={invitation?.email} readOnly={Boolean(invitation)} required /></label>
      <div className="field-row">
        <label>{t("password")}<span className="password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required /><button type="button" aria-label={showPassword ? t("hidePassword") : t("showPassword")} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label>
        <label>{t("confirmPassword")}<span className="password-wrap"><input name="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" minLength={8} required /><button type="button" aria-label={showConfirm ? t("hideConfirmPassword") : t("showConfirmPassword")} aria-pressed={showConfirm} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}</button></span></label>
      </div>
      <p className="field-hint">{t("passwordHint")}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="submit-button" disabled={busy}>{busy ? t("creatingAccount") : invitation ? t("joinBusinessButton", { businessName: invitation.businessName }) : t("createAccount")}</button>
    </form>
    <><div className="divider"><span>{t("orSignUpWith")}</span></div><OAuthButtons mode="signup" invitationToken={invitation ? invitationToken : undefined} onStart={() => { safeToLeave.current = true; }} /></>
    <div className="post-oauth">
      <p className="switch-auth">{t("alreadyAccount")} <Link href="/login">{t("signIn")}</Link></p>
      <p className="legal-copy">{t("agreementPrefix")} <Link href="/terms">{t("terms")}</Link> {t("and")} <Link href="/privacy">{t("privacy")}</Link>.</p>
    </div>
    {showRefusal && invitation && <div className="invitation-refusal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRefusal(false); }}>
      <section className="invitation-refusal-dialog" role="alertdialog" aria-modal="true" aria-labelledby="invitation-refusal-title" aria-describedby="invitation-refusal-description">
        <AlertTriangle aria-hidden="true" />
        <h2 id="invitation-refusal-title">{t("refuseInvitationTitle")}</h2>
        <p id="invitation-refusal-description">{t("refuseInvitationDescription", { businessName: invitation.businessName })}</p>
        <div><button type="button" onClick={() => setShowRefusal(false)} disabled={refusing}>{t("keepInvitation")}</button><button className="danger" type="button" onClick={refuseInvitation} disabled={refusing}>{refusing ? t("refusingInvitation") : t("refuseAndCreate")}</button></div>
      </section>
    </div>}
  </>;
}
