"use client";

import {
  Bell,
  FileText,
  LayoutDashboard,
  Moon,
  ShoppingCart,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, type SVGProps, useEffect, useRef, useState } from "react";

import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { authRequest, type AuthUser } from "@/lib/api/client";

function StockIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...props} className="stock-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z" />
    <path className="stock-icon-detail" d="M6 21V10a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v11M6 13h12M6 17h12" />
  </svg>;
}

function FinanceIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
    <path className="nav-icon-detail" d="M3.5 9h17M16.5 14.5h1" />
  </svg>;
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 2.6h3.4l.6 2.2c.5.2 1 .5 1.5.9l2.2-.6 1.7 2.9-1.6 1.6c.1.5.1 1.1 0 1.6l1.6 1.6-1.7 2.9-2.2-.6c-.5.4-1 .7-1.5.9l-.6 2.2h-3.4L9.7 16c-.5-.2-1-.5-1.5-.9l-2.2.6-1.7-2.9 1.6-1.6a8 8 0 0 1 0-1.6L4.3 8 6 5.1l2.2.6c.5-.4 1-.7 1.5-.9z" />
    <circle className="nav-icon-detail" cx="12" cy="10.4" r="2.6" />
  </svg>;
}

function HelpIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9.5" />
    <path className="nav-icon-detail" d="M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2.9-1.2 1.8M12 16.8h.01" />
  </svg>;
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stock", label: "Stock", icon: StockIcon },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/finance", label: "Finance", icon: FinanceIcon },
  { href: "/documents", label: "Your Docs", icon: FileText },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/stock": "Stock",
  "/sales": "Sales",
  "/finance": "Finance",
  "/documents": "Your Docs",
  "/settings": "Settings",
  "/profile": "Help",
};

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
  const pageTitle = pageTitles[pathname] ?? "Kungahara";
  const currentDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return <div className={`dashboard-shell${dark ? " dashboard-theme-dark" : ""}`}>
    <aside className="dashboard-sidebar">
      <Brand />
      <p className="dashboard-nav-label">Menu</p>
      <nav className="dashboard-nav" aria-label="Menu">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <Link className={pathname === href ? "active" : ""} href={href} key={href}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="dashboard-general">
        <p className="dashboard-nav-label">General</p>
        <nav className="dashboard-secondary-nav" aria-label="General">
          <Link className={pathname.startsWith("/settings") ? "active" : ""} href="/settings"><SettingsIcon aria-hidden="true" /><span>Settings</span></Link>
          <Link className={pathname.startsWith("/profile") ? "active" : ""} href="/profile"><HelpIcon aria-hidden="true" /><span>Help</span></Link>
          <LogoutButton className="dashboard-sidebar-signout" showIcon />
        </nav>
      </div>
    </aside>
    <section className="dashboard-stage">
      <header className="dashboard-topbar">
        <div className="dashboard-page-identity"><strong>{pageTitle}</strong><small>{currentDate}</small></div>
        <div className="dashboard-topbar-actions">
          <div className="dashboard-theme-toggle" aria-label="Theme">
            <button className={!dark ? "active" : ""} type="button" aria-label="Use light theme" aria-pressed={!dark} title="Light theme" onClick={() => setDark(false)}><Sun aria-hidden="true" /></button>
            <button className={dark ? "active" : ""} type="button" aria-label="Use dark theme" aria-pressed={dark} title="Dark theme" onClick={() => setDark(true)}><Moon aria-hidden="true" /></button>
          </div>
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
