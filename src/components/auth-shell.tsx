import Link from "next/link";
import { X } from "lucide-react";
import { Brand } from "@/components/brand";
import { AuthStoryCarousel } from "@/components/auth-story-carousel";

export function AuthShell({ mode, children }: { mode: "login" | "signup"; children: React.ReactNode }) {
  return <main className="auth-page">
    <div className="auth-backdrop" aria-hidden="true"><span /><span /><span /></div>
    <section className="auth-card">
      <div className="auth-story" data-mode={mode}><Brand /><AuthStoryCarousel /></div>
      <div className="auth-form-panel"><Link className="auth-close" href="/" aria-label="Close authentication"><X aria-hidden="true" /></Link>{children}</div>
    </section>
  </main>;
}
