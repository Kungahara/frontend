import Link from "next/link";
import { X } from "lucide-react";
import { AuthLandingBackdrop } from "@/components/auth-landing-backdrop";
import { Brand } from "@/components/brand";
import { AuthStoryCarousel } from "@/components/auth-story-carousel";
import { getTranslations } from "next-intl/server";

export async function AuthShell({ mode, children }: { mode: "login" | "signup"; children: React.ReactNode }) {
  return <AuthShellWithBackdrop mode={mode}>{children}</AuthShellWithBackdrop>;
}

const marketingSections = new Set(["home", "features", "how-it-works", "about", "faq", "contact"]);

export async function AuthShellWithBackdrop({ mode, children, backdropSection = "home", backdropY = 0 }: { mode: "login" | "signup"; children: React.ReactNode; backdropSection?: string; backdropY?: number }) {
  const t = await getTranslations("Auth");
  const section = marketingSections.has(backdropSection) ? backdropSection : "home";
  const scrollY = Number.isFinite(backdropY) && backdropY >= 0 ? Math.round(backdropY) : 0;
  const returnHref = `/?restoreY=${scrollY}#${encodeURIComponent(section)}`;

  return <main className="auth-page">
    <AuthLandingBackdrop section={section} />
    <section className="auth-card">
      <div className="auth-story" data-mode={mode}><Brand /><AuthStoryCarousel /></div>
      <div className="auth-form-panel"><Link className="auth-close" href={returnHref} replace scroll={false} aria-label={t("closeAuthentication")}><X aria-hidden="true" /></Link><div className="auth-form-brand"><Brand ariaLabel={t("kungaharaHome")} /></div>{children}</div>
    </section>
  </main>;
}
