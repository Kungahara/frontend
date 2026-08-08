import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "@/components/brand";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Brand />
        <div>
          <p className="eyebrow">Authentication placeholder</p>
          <h1>Welcome back.</h1>
          <p>
            The sign-in form will be connected after the Django authentication
            endpoints and session contract are defined.
          </p>
        </div>
        <div className="empty-form" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <Link className="text-link" href="/">← Return home</Link>
      </div>
    </main>
  );
}
