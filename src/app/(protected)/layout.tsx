"use client";

import { Bell, CircleHelp, Moon, Settings, Sun, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { authRequest, type AuthUser } from "@/lib/api/client";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dark, setDark] = useState(false);
  const authenticationStarted = useRef(false);

  useEffect(() => {
    // React Strict Mode invokes effects twice in development. Refresh tokens
    // are rotated and single-use, so a duplicate /me request can otherwise
    // reuse the old token and clear the session established by the first one.
    if (authenticationStarted.current) return;
    authenticationStarted.current = true;
    authRequest<{ user: AuthUser }>("me")
      .then((result) => setUser(result.user))
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!user) {
    return <main className="dashboard-page-loading"><span aria-hidden="true" /><p>The workspace is still loading…</p></main>;
  }

  const name = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return <div className={`dashboard-shell${dark ? " dashboard-theme-dark" : ""}`}>
    <aside className="dashboard-sidebar">
      <Brand />
      <p className="dashboard-nav-label">Menu</p>
      <nav className="dashboard-nav" aria-label="Menu">
        <Link className={pathname === "/dashboard" ? "active" : ""} href="/dashboard"><Warehouse aria-hidden="true" /><span>Stock</span></Link>
      </nav>
      <div className="dashboard-general">
        <p className="dashboard-nav-label">General</p>
        <nav className="dashboard-secondary-nav" aria-label="General">
          <Link className={pathname.startsWith("/settings") ? "active" : ""} href="/settings"><Settings aria-hidden="true" /><span>Settings</span></Link>
          <Link className={pathname.startsWith("/profile") ? "active" : ""} href="/profile"><CircleHelp aria-hidden="true" /><span>Help</span></Link>
          <LogoutButton className="dashboard-sidebar-signout" showIcon />
        </nav>
      </div>
    </aside>
    <section className="dashboard-stage">
      <header className="dashboard-topbar">
        <div className="dashboard-page-identity"><strong>Stock</strong><small>Manage products, quantities, and stock movements.</small></div>
        <div className="dashboard-topbar-actions">
          <button type="button" aria-label={dark ? "Use light theme" : "Use dark theme"} title={dark ? "Light theme" : "Dark theme"} onClick={() => setDark(!dark)}>{dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</button>
          <button type="button" aria-label="Notifications"><Bell aria-hidden="true" /></button>
          <div className="dashboard-account">
            <span className="dashboard-account-mark" aria-hidden="true">{initials}</span>
            <span><strong>{name}</strong><small>{user.email}</small></span>
          </div>
        </div>
      </header>
      <main className="dashboard-workspace">{children}</main>
    </section>
  </div>;
}
