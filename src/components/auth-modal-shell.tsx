"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Brand } from "@/components/brand";
import { AuthStoryCarousel } from "@/components/auth-story-carousel";

export function AuthModalShell({ mode, children, onClose, onModeChange }: { mode: "login" | "signup"; children: React.ReactNode; onClose: () => void; onModeChange: (mode: "login" | "signup") => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  function followAuthSwitch(event: React.MouseEvent<HTMLElement>) {
    const anchor = event.target instanceof Element ? event.target.closest("a") : null;
    if (!(anchor instanceof HTMLAnchorElement) || !["/login", "/signup"].includes(anchor.pathname)) return;
    event.preventDefault();
    onModeChange(anchor.pathname === "/signup" ? "signup" : "login");
  }

  return <main className="auth-modal-page" onClickCapture={followAuthSwitch}>
    <section className="auth-card" role="dialog" aria-modal="true" aria-label={mode === "login" ? "Sign in" : "Create account"}>
      <div className="auth-story" data-mode={mode}><Brand /><AuthStoryCarousel /></div>
      <div className="auth-form-panel"><button className="auth-close" type="button" aria-label="Close authentication" onClick={onClose}><X aria-hidden="true" /></button><div className="auth-modal-scroll"><div className="auth-form-brand"><Brand /></div>{children}</div></div>
    </section>
  </main>;
}
