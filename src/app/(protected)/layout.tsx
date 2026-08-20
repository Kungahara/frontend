"use client";

import {
  Banknote,
  Bell,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Moon,
  PackageX,
  Rocket,
  ShoppingCart,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, type SVGProps, useCallback, useEffect, useRef, useState } from "react";

import { Brand } from "@/components/brand";
import { CurrencyMonitor, type CurrencyAlert } from "@/components/currency-monitor";
import { LogoutButton } from "@/components/logout-button";
import { ProfileMenu } from "@/components/profile-menu";
import { authRequest, type AuthUser } from "@/lib/api/client";
import { inventoryFetch } from "@/lib/inventory-client";

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

function NotificationIcon({ id }: { id: string }) {
  if (id.startsWith("loan-")) return <Banknote aria-hidden="true" />;
  if (id.startsWith("empty-stock-")) return <PackageX aria-hidden="true" />;
  if (id.startsWith("no-sales-")) return <ShoppingCart aria-hidden="true" />;
  return <CircleDollarSign aria-hidden="true" />;
}

function notificationTone(id: string) {
  if (id.startsWith("loan-")) return "loan";
  if (id.startsWith("empty-stock-")) return "stock";
  if (id.startsWith("no-sales-")) return "sales";
  return "currency";
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
  "/help": "Help",
};

const sidebarSlides = [
  {
    title: "Future",
    description: "Build a smarter business, one clear decision at a time.",
    points: ["Plan what comes next", "Grow with confidence"],
    icon: Rocket,
  },
  {
    title: "Features",
    description: "Everything you need to keep daily work moving smoothly.",
    points: ["Simple business tools", "Insights in one place"],
    icon: Sparkles,
  },
];

const themeStorageKey = "kungahara:dashboard-theme";
const businessClock = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Kigali", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", hourCycle: "h23" });

function businessTime(date = new Date()) {
  const parts = Object.fromEntries(businessClock.formatToParts(date).map((part) => [part.type, part.value]));
  return { dateKey: `${parts.year}-${parts.month}-${parts.day}`, weekday: parts.weekday, hour: Number(parts.hour) };
}

function notificationStorageKey(userId: string, date = new Date()) {
  return `kungahara:notifications:${userId}:${businessTime(date).dateKey}`;
}

function savedDarkTheme() {
  if (typeof window === "undefined") return false;
  try {
    const theme = window.localStorage.getItem(themeStorageKey);
    return theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  } catch {
    return false;
  }
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dark, setDark] = useState(savedDarkTheme);
  const [sidebarSlide, setSidebarSlide] = useState(0);
  const [currencyAlerts, setCurrencyAlerts] = useState<CurrencyAlert[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsUnread, setNotificationsUnread] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [alertsHydrated, setAlertsHydrated] = useState(false);
  const authenticationStarted = useRef(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const currencyAlertIds = useRef(new Set<string>());
  const alertsDate = useRef(businessTime().dateKey);

  function toggleTheme() {
    setDark((current) => {
      const next = !current;
      window.localStorage.setItem(themeStorageKey, next ? "dark" : "light");
      try {
        const settings = JSON.parse(window.localStorage.getItem("kungahara:settings") ?? "{}") as Record<string, unknown>;
        window.localStorage.setItem("kungahara:settings", JSON.stringify({ ...settings, theme: next ? "dark" : "light" }));
      } catch { /* Theme still works when other saved settings are invalid. */ }
      return next;
    });
  }

  function dismissNotification(id: string) {
    setCurrencyAlerts((current) => current.filter((alert) => alert.id !== id));
  }

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

  useEffect(() => {
    [...menuItems.map((item) => item.href), "/settings", "/help"].forEach((href) => router.prefetch(href));
  }, [router]);

  useEffect(() => {
    function updateUser(event: Event) {
      setUser((event as CustomEvent<AuthUser>).detail);
    }
    window.addEventListener("kungahara:user-changed", updateUser);
    return () => window.removeEventListener("kungahara:user-changed", updateUser);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function applySavedTheme() { setDark(savedDarkTheme()); }
    function applySettings(event: Event) {
      const theme = (event as CustomEvent<{ theme?: string }>).detail?.theme;
      if (theme === "dark") setDark(true);
      else if (theme === "light") setDark(false);
      else if (theme === "system") setDark(media.matches);
    }
    media.addEventListener("change", applySavedTheme);
    window.addEventListener("kungahara:settings-changed", applySettings);
    return () => { media.removeEventListener("change", applySavedTheme); window.removeEventListener("kungahara:settings-changed", applySettings); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSidebarSlide((current) => (current + 1) % sidebarSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const receiveCurrencyAlert = useCallback((alert: CurrencyAlert) => {
    if (currencyAlertIds.current.has(alert.id)) return;
    currencyAlertIds.current.add(alert.id);
    setCurrencyAlerts((current) => [alert, ...current]);
    setNotificationsUnread(true);
  }, []);

  const refreshBusinessAlerts = useCallback(async () => {
    try {
      const [productsResponse, salesResponse, loansResponse] = await Promise.all([
        inventoryFetch("/api/products"), inventoryFetch("/api/sales"), inventoryFetch("/api/loans"),
      ]);
      if (!productsResponse.ok || !salesResponse.ok || !loansResponse.ok) return;
      const [productsBody, salesBody, loansBody] = await Promise.all([productsResponse.json(), salesResponse.json(), loansResponse.json()]);
      const now = new Date();
      const { dateKey, weekday, hour } = businessTime(now);
      const alerts: CurrencyAlert[] = [];
      let reminderSettings = { salesReminders: true, noonReminder: true, eveningReminder: true, loanReminders: true, workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] };
      try { reminderSettings = { ...reminderSettings, ...JSON.parse(window.localStorage.getItem("kungahara:settings") ?? "{}") }; } catch { /* Keep defaults. */ }
      const isWorkingDay = reminderSettings.workingDays.includes(weekday);
      const hasSalesToday = (salesBody.sales ?? []).some((sale: { createdAt: string }) => businessTime(new Date(sale.createdAt)).dateKey === dateKey);
      if (reminderSettings.salesReminders && isWorkingDay && !hasSalesToday) {
        if (reminderSettings.noonReminder && hour >= 12 && hour < 20) alerts.push({ id: `no-sales-1200-${dateKey}`, title: "Midday sales reminder", message: "It is after 12:00 and no sale has been recorded today. Add any sales made so your income and profit stay accurate." });
        if (reminderSettings.eveningReminder && hour >= 20) alerts.push({ id: `no-sales-2000-${dateKey}`, title: "Evening sales reminder", message: "It is after 20:00 and no sale has been recorded today. Add any sales made before closing your records for the day." });
      }
      const emptyItems = (productsBody.products ?? []).filter((product: { quantity: number }) => product.quantity === 0);
      if (emptyItems.length) alerts.push({ id: `empty-stock-${dateKey}`, title: "Items out of stock", message: `${emptyItems.length} item${emptyItems.length === 1 ? " is" : "s are"} at 0 quantity and need restocking.` });
      if (reminderSettings.loanReminders) (loansBody.loans ?? []).forEach((loan: { id: string; source: string; borrowedOn: string; deadline: string }) => {
        const day = 86_400_000;
        const borrowed = new Date(`${loan.borrowedOn}T00:00:00`);
        const deadline = new Date(`${loan.deadline}T00:00:00`);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const totalDays = Math.max(1, Math.round((deadline.getTime() - borrowed.getTime()) / day));
        const daysLeft = Math.round((deadline.getTime() - today.getTime()) / day);
        const reminderDays = new Set<number>([0, 1]);
        for (let remaining = Math.floor(totalDays / 2); remaining > 1; remaining = Math.floor(remaining / 2)) reminderDays.add(remaining);
        if (daysLeft >= 0 && reminderDays.has(daysLeft)) alerts.push({ id: `loan-${loan.id}-${daysLeft}-${dateKey}`, title: "Loan payment reminder", message: daysLeft === 0 ? `${loan.source} is due today.` : `${loan.source} is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}, on ${deadline.toLocaleDateString("en-GB")}.` });
      });
      alerts.forEach(receiveCurrencyAlert);
    } catch { /* Notifications should never block the workspace. */ }
  }, [receiveCurrencyAlert]);

  useEffect(() => {
    if (!user || !alertsHydrated) return;
    void refreshBusinessAlerts();
    const timer = window.setInterval(refreshBusinessAlerts, 60_000);
    window.addEventListener("kungahara:data-changed", refreshBusinessAlerts);
    window.addEventListener("kungahara:settings-changed", refreshBusinessAlerts);
    return () => { window.clearInterval(timer); window.removeEventListener("kungahara:data-changed", refreshBusinessAlerts); window.removeEventListener("kungahara:settings-changed", refreshBusinessAlerts); };
  }, [alertsHydrated, refreshBusinessAlerts, user]);

  useEffect(() => {
    if (!user) return;
    const key = notificationStorageKey(user.id);
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(key) ?? "[]") as CurrencyAlert[];
        const alerts = Array.isArray(saved) ? saved.filter((alert) => !alert.id.startsWith("no-sales-") || alert.id.startsWith("no-sales-1200-") || alert.id.startsWith("no-sales-2000-")) : [];
        currencyAlertIds.current = new Set(alerts.map((alert) => alert.id));
        setCurrencyAlerts(alerts);
        setNotificationsUnread(window.localStorage.getItem(`${key}:unread`) === "true");
      } catch {
        setCurrencyAlerts([]);
      }
      setAlertsHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!alertsHydrated || !user) return;
    const key = notificationStorageKey(user.id);
    window.localStorage.setItem(key, JSON.stringify(currencyAlerts));
    window.localStorage.setItem(`${key}:unread`, String(notificationsUnread));
  }, [alertsHydrated, currencyAlerts, notificationsUnread, user]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentDateKey = businessTime().dateKey;
      if (currentDateKey === alertsDate.current) return;
      alertsDate.current = currentDateKey;
      currencyAlertIds.current.clear();
      setCurrencyAlerts([]);
      setNotificationsUnread(false);
      void refreshBusinessAlerts();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [refreshBusinessAlerts]);

  useEffect(() => {
    if (!notificationsOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!notificationsRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [notificationsOpen]);

  useEffect(() => {
    // Route completion is an external navigation event reflected by usePathname.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRouteLoading(false);
    setPendingPath(null);
  }, [pathname]);

  if (!user) {
    return <main className={`dashboard-page-loading${dark ? " dashboard-theme-dark" : ""}`} suppressHydrationWarning><span aria-hidden="true" /><p>The workspace is still loading…</p></main>;
  }

  const displayedPath = pendingPath ?? pathname;
  const pageTitle = pageTitles[displayedPath] ?? "Kungahara";
  const activeSlide = sidebarSlides[sidebarSlide];
  const SlideIcon = activeSlide.icon;
  const currentDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return <div className={`dashboard-shell${dark ? " dashboard-theme-dark" : ""}`}>
    <aside className="dashboard-sidebar">
      <Brand subtitle={user.businessName} />
      <p className="dashboard-nav-label">Menu</p>
      <nav className="dashboard-nav" aria-label="Menu">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <Link className={displayedPath === href ? "active" : ""} href={href} key={href} onClick={() => { if (pathname !== href) { setPendingPath(href); setRouteLoading(true); } }}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <section className="dashboard-sidebar-promo" aria-label="Kungahara highlights" aria-live="polite">
        <div className="sidebar-promo-art" aria-hidden="true">
          <span className="sidebar-promo-orbit" />
          <span className="sidebar-promo-icon"><SlideIcon /></span>
        </div>
        <div className="sidebar-promo-copy" key={activeSlide.title}>
          <p>{activeSlide.title}</p>
          <strong>{activeSlide.description}</strong>
          <ul>{activeSlide.points.map((point) => <li key={point}>{point}</li>)}</ul>
        </div>
        <div className="sidebar-promo-dots" aria-label="Choose highlight">
          {sidebarSlides.map((slide, index) => (
            <button className={sidebarSlide === index ? "active" : ""} type="button" aria-label={`Show ${slide.title}`} aria-pressed={sidebarSlide === index} key={slide.title} onClick={() => setSidebarSlide(index)} />
          ))}
        </div>
      </section>
      <div className="dashboard-general">
        <p className="dashboard-nav-label">General</p>
        <nav className="dashboard-secondary-nav" aria-label="General">
          <Link className={displayedPath.startsWith("/settings") ? "active" : ""} href="/settings" onClick={() => { if (!pathname.startsWith("/settings")) { setPendingPath("/settings"); setRouteLoading(true); } }}><SettingsIcon aria-hidden="true" /><span>Settings</span></Link>
          <Link className={displayedPath.startsWith("/help") ? "active" : ""} href="/help" onClick={() => { if (!pathname.startsWith("/help")) { setPendingPath("/help"); setRouteLoading(true); } }}><HelpIcon aria-hidden="true" /><span>Help</span></Link>
          <LogoutButton className="dashboard-sidebar-signout" showIcon />
        </nav>
      </div>
    </aside>
    <section className="dashboard-stage">
      <header className="dashboard-topbar">
        <div className="dashboard-page-identity"><strong>{pageTitle}</strong><small>{currentDate}</small></div>
        <div className="dashboard-topbar-right">
          <CurrencyMonitor onSignificantChange={receiveCurrencyAlert} />
          <div className="dashboard-topbar-actions" ref={notificationsRef}>
            <div className="dashboard-theme-toggle" aria-label="Theme">
              <button className={!dark ? "active" : ""} type="button" aria-label="Toggle theme" aria-pressed={!dark} title="Toggle theme" onClick={toggleTheme}><Sun aria-hidden="true" /></button>
              <button className={dark ? "active" : ""} type="button" aria-label="Toggle theme" aria-pressed={dark} title="Toggle theme" onClick={toggleTheme}><Moon aria-hidden="true" /></button>
            </div>
            <div className="dashboard-notifications">
              <button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { const next = !notificationsOpen; setNotificationsOpen(next); if (next) setNotificationsUnread(false); }}><Bell aria-hidden="true" />{notificationsUnread && <span className="notification-dot" />}</button>
            </div>
            <ProfileMenu user={user} onUserChange={setUser} />
            {notificationsOpen && <div className="notification-popover">
              <div className="notification-popover-header"><strong>Today&apos;s notifications</strong></div>
              {currencyAlerts.length ? currencyAlerts.map((alert) => <article className={`notification-item ${notificationTone(alert.id)}`} key={alert.id}><span className="notification-item-icon"><NotificationIcon id={alert.id} /></span><div><b>{alert.title}</b><p>{alert.message}</p></div><button className="notification-dismiss" type="button" aria-label={`Dismiss ${alert.title}`} onClick={() => dismissNotification(alert.id)}><X aria-hidden="true" /></button></article>) : <p>No new notifications.</p>}
            </div>}
          </div>
        </div>
      </header>
      <main className={`dashboard-workspace${displayedPath === "/stock" || displayedPath === "/sales" || displayedPath === "/finance" || displayedPath === "/documents" ? " data-page-workspace" : ""}${displayedPath === "/help" ? " help-page-workspace" : ""}`}>
        {children}
        {routeLoading && <div className="route-loading-screen" role="status" aria-live="polite">
          <span className="route-loading-spinner" aria-hidden="true" />
          <strong>Loading page…</strong>
          <small>Please wait a moment.</small>
        </div>}
      </main>
    </section>
  </div>;
}
