"use client";

import { Suspense, useEffect, useState } from "react";
import { AuthModalShell } from "@/components/auth-modal-shell";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";

type AuthMode = "login" | "signup";

export function AuthModalHost() {
  const [mode, setMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: AuthMode }>).detail;
      setMode(detail?.mode === "signup" ? "signup" : "login");
    };
    window.addEventListener("kungahara:open-auth", open);
    return () => window.removeEventListener("kungahara:open-auth", open);
  }, []);

  if (!mode) return null;

  return <AuthModalShell mode={mode} onClose={() => setMode(null)} onModeChange={setMode}>
    {mode === "login"
      ? <Suspense fallback={<p className="form-loading">Preparing sign in…</p>}><LoginForm /></Suspense>
      : <SignupForm />}
  </AuthModalShell>;
}
