"use client";

import {
  Banknote,
  Bell,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Moon,
  PackageX,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, type SVGProps, useCallback, useEffect, useRef, useState } from "react";

import { Brand } from "@/components/brand";
import { AuthUserProvider } from "@/components/auth-user-context";
import { AppPageSkeleton } from "@/components/app-page-skeleton";
import { CurrencyMonitor, type CurrencyAlert } from "@/components/currency-monitor";
import { InactivityLogout } from "@/components/inactivity-logout";
import { LogoutButton } from "@/components/logout-button";
import { ProfileMenu } from "@/components/profile-menu";
import { UsageHeartbeat } from "@/components/usage-heartbeat";
import { WorkspaceCopyTranslator } from "@/components/workspace-copy-translator";
import { localizedFullDate } from "@/lib/localized-date";
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
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/stock", key: "stock", icon: StockIcon },
  { href: "/sales", key: "sales", icon: ShoppingCart },
  { href: "/finance", key: "finance", icon: FinanceIcon },
  { href: "/documents", key: "documents", icon: FileText },
];

const pageTitleKeys: Record<string, "dashboard" | "stock" | "sales" | "finance" | "documents" | "settings" | "help"> = {
  "/dashboard": "dashboard",
  "/stock": "stock",
  "/sales": "sales",
  "/finance": "finance",
  "/documents": "documents",
  "/settings": "settings",
  "/help": "help",
};

const sidebarSlides = [
  {
    key: "stock",
    icon: StockIcon,
  },
  {
    key: "sales",
    icon: ShoppingCart,
  },
  {
    key: "finance",
    icon: Banknote,
  },
] as const;

const themeStorageKey = "kungahara:dashboard-theme";
const languageStorageKey = "kungahara:language";
type AppLanguage = "rw" | "en" | "fr";
const languages: Array<{ value: AppLanguage; shortLabel: string; label: string }> = [
  { value: "rw", shortLabel: "RW", label: "Kinyarwanda" },
  { value: "en", shortLabel: "EN", label: "English" },
  { value: "fr", shortLabel: "FR", label: "French" },
];
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

function savedLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const language = window.localStorage.getItem(languageStorageKey);
    return language === "rw" || language === "fr" ? language : "en";
  } catch {
    return "en";
  }
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Shell");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dark, setDark] = useState(savedDarkTheme);
  const [language, setLanguage] = useState<AppLanguage>(savedLanguage);
  const [sidebarSlide, setSidebarSlide] = useState(0);
  const [currencyAlerts, setCurrencyAlerts] = useState<CurrencyAlert[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsUnread, setNotificationsUnread] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarTransitioning, setSidebarTransitioning] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [alertsHydrated, setAlertsHydrated] = useState(false);
  const authenticationStarted = useRef(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const currencyAlertIds = useRef(new Set<string>());
  const sidebarTransitionTimers = useRef<number[]>([]);
  const sidebarSlideChangedAt = useRef(0);
  const alertsDate = useRef(businessTime().dateKey);
  const deliveryAttemptIds = useRef(new Set<string>());

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

  function selectLanguage(next: AppLanguage) {
    setLanguage(next);
    currencyAlertIds.current.clear();
    deliveryAttemptIds.current.clear();
    setCurrencyAlerts([]);
    setNotificationsUnread(false);
    try { window.localStorage.setItem(languageStorageKey, next); } catch { /* The selection still applies for this visit. */ }
    window.dispatchEvent(new CustomEvent("kungahara:language-changed", { detail: { language: next } }));
    void fetch("/api/language", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: next }) }).finally(() => window.location.reload());
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
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    function syncLanguage(event: Event) {
      const next = (event as CustomEvent<{ language?: string }>).detail?.language;
      if (next === "rw" || next === "en" || next === "fr") setLanguage(next);
    }
    window.addEventListener("kungahara:language-changed", syncLanguage);
    return () => window.removeEventListener("kungahara:language-changed", syncLanguage);
  }, []);

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
    sidebarSlideChangedAt.current = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (now - sidebarSlideChangedAt.current < 5000) return;
      sidebarSlideChangedAt.current = now;
      setSidebarSlide((current) => (current + 1) % sidebarSlides.length);
    }, 250);
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
        if (reminderSettings.noonReminder && hour >= 12 && hour < 20) alerts.push({ id: `no-sales-1200-${dateKey}`, title: t("alerts.middayTitle"), message: t("alerts.middayMessage") });
        if (reminderSettings.eveningReminder && hour >= 20) alerts.push({ id: `no-sales-2000-${dateKey}`, title: t("alerts.eveningTitle"), message: t("alerts.eveningMessage") });
      }
      const emptyItems = (productsBody.products ?? []).filter((product: { quantity: number }) => product.quantity === 0);
      if (emptyItems.length) alerts.push({ id: `empty-stock-${dateKey}`, title: t("alerts.outOfStockTitle"), message: t("alerts.outOfStockMessage", { count: emptyItems.length }) });
      if (reminderSettings.loanReminders) (loansBody.loans ?? []).forEach((loan: { id: string; source: string; borrowedOn: string; deadline: string }) => {
        const day = 86_400_000;
        const borrowed = new Date(`${loan.borrowedOn}T00:00:00`);
        const deadline = new Date(`${loan.deadline}T00:00:00`);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const totalDays = Math.max(1, Math.round((deadline.getTime() - borrowed.getTime()) / day));
        const daysLeft = Math.round((deadline.getTime() - today.getTime()) / day);
        const reminderDays = new Set<number>([0, 1]);
        for (let remaining = Math.floor(totalDays / 2); remaining > 1; remaining = Math.floor(remaining / 2)) reminderDays.add(remaining);
        if (daysLeft >= 0 && reminderDays.has(daysLeft)) alerts.push({ id: `loan-${loan.id}-${daysLeft}-${dateKey}`, title: t("alerts.loanTitle"), message: daysLeft === 0 ? t("alerts.loanDueToday", { source: loan.source }) : t("alerts.loanDueLater", { source: loan.source, days: daysLeft, date: deadline.toLocaleDateString(language === "fr" ? "fr-FR" : language === "rw" ? "rw-RW" : "en-GB") }) });
      });
      alerts.forEach(receiveCurrencyAlert);
    } catch { /* Notifications should never block the workspace. */ }
  }, [language, receiveCurrencyAlert, t]);

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
        const alerts = Array.isArray(saved) ? saved.filter((alert) => {
          if (alert.id.startsWith("simulated-")) return false;
          return !alert.id.startsWith("no-sales-") || alert.id.startsWith("no-sales-1200-") || alert.id.startsWith("no-sales-2000-");
        }) : [];
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
    if (!alertsHydrated || !user || currencyAlerts.length === 0) return;
    let deliveryEnabled = false;
    try {
      const settings = JSON.parse(window.localStorage.getItem("kungahara:settings") ?? "{}") as { emailDelivery?: boolean; browserPushDelivery?: boolean };
      deliveryEnabled = Boolean(settings.emailDelivery || settings.browserPushDelivery);
    } catch { /* Server preferences still protect delivery if local settings are invalid. */ }
    if (!deliveryEnabled) return;
    currencyAlerts.forEach((alert) => {
      if (alert.id.startsWith("simulated-")) return;
      if (deliveryAttemptIds.current.has(alert.id)) return;
      deliveryAttemptIds.current.add(alert.id);
      void inventoryFetch("/api/notifications/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      }).then((response) => {
        if (!response.ok) deliveryAttemptIds.current.delete(alert.id);
      }).catch(() => deliveryAttemptIds.current.delete(alert.id));
    });
  }, [alertsHydrated, currencyAlerts, user]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentDateKey = businessTime().dateKey;
      if (currentDateKey === alertsDate.current) return;
      alertsDate.current = currentDateKey;
      currencyAlertIds.current.clear();
      deliveryAttemptIds.current.clear();
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

  useEffect(() => () => sidebarTransitionTimers.current.forEach((timer) => window.clearTimeout(timer)), []);

  function transitionSidebar(collapsed: boolean) {
    if (sidebarTransitioning || collapsed === sidebarCollapsed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setSidebarCollapsed(collapsed); return; }
    sidebarTransitionTimers.current.forEach((timer) => window.clearTimeout(timer));
    setSidebarTransitioning(true);
    setSidebarCollapsed(collapsed);
    sidebarTransitionTimers.current = [
      window.setTimeout(() => setSidebarTransitioning(false), 700),
    ];
  }

  if (!user) {
    return <main className={`dashboard-page-loading${dark ? " dashboard-theme-dark" : ""}`} aria-label={t("workspaceLoading")} role="status" suppressHydrationWarning><span aria-hidden="true" /><p suppressHydrationWarning>{t("workspaceLoading")}</p></main>;
  }

  const displayedPath = pendingPath ?? pathname;
  const pageTitleKey = pageTitleKeys[displayedPath];
  const pageTitle = pageTitleKey ? t(`navigation.${pageTitleKey}`) : "Kungahara";
  const activeSlide = sidebarSlides[sidebarSlide];
  const activeSlideTitle = t(`slides.${activeSlide.key}.title`);
  const SlideIcon = activeSlide.icon;
  const currentDate = localizedFullDate(new Date(), language);

  return <AuthUserProvider user={user} setUser={setUser}><div className={`dashboard-shell${dark ? " dashboard-theme-dark" : ""}${sidebarCollapsed ? " sidebar-collapsed" : ""}${sidebarTransitioning ? " sidebar-transitioning" : ""}`}>
    <InactivityLogout />
    <UsageHeartbeat />
    <WorkspaceCopyTranslator />
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-header">
        <Brand subtitle={user.businessName} ariaLabel={sidebarCollapsed ? t("expandSidebar") : t("home")} onClick={sidebarCollapsed ? (event) => { event.preventDefault(); transitionSidebar(false); } : undefined} />
        {sidebarCollapsed && <span className="sidebar-logo-expand-icon" aria-hidden="true"><PanelLeftOpen /></span>}
        {!sidebarCollapsed && <button className="sidebar-collapse-toggle" type="button" aria-label={t("collapseSidebar")} title={t("collapseSidebar")} onClick={() => transitionSidebar(true)}><PanelLeftClose aria-hidden="true" /></button>}
      </div>
      <p className="dashboard-nav-label">{t("menu")}</p>
      <nav className="dashboard-nav" aria-label={t("menu")}>
        {menuItems.map(({ href, key, icon: Icon }) => (
          <Link className={displayedPath === href ? "active" : ""} href={href} key={href} onClick={() => { if (pathname !== href) { setPendingPath(href); setRouteLoading(true); } }}>
            <Icon aria-hidden="true" />
            <span>{t(`navigation.${key}`)}</span>
          </Link>
        ))}
      </nav>
      <section className="dashboard-sidebar-promo" aria-label={t("highlights")} aria-live="polite">
        <div className="sidebar-promo-art" aria-hidden="true">
          <span className="sidebar-promo-orbit" />
          <span className="sidebar-promo-icon"><SlideIcon /></span>
        </div>
        <div className="sidebar-promo-copy" key={activeSlide.key}>
          <p>{activeSlideTitle}</p>
          <strong>{t(`slides.${activeSlide.key}.heading`)}</strong>
          <ul><li>{t(`slides.${activeSlide.key}.point1`)}</li><li>{t(`slides.${activeSlide.key}.point2`)}</li></ul>
        </div>
        <div className="sidebar-promo-dots" aria-label={t("chooseHighlight")}>
          {sidebarSlides.map((slide, index) => (
            <button className={sidebarSlide === index ? "active" : ""} type="button" aria-label={t("showHighlight", { title: t(`slides.${slide.key}.title`) })} aria-pressed={sidebarSlide === index} key={slide.key} onClick={() => { sidebarSlideChangedAt.current = Date.now(); setSidebarSlide(index); }} />
          ))}
        </div>
      </section>
      <div className="dashboard-general">
        <p className="dashboard-nav-label">{t("general")}</p>
        <nav className="dashboard-secondary-nav" aria-label={t("general")}>
          <Link className={displayedPath.startsWith("/settings") ? "active" : ""} href="/settings" onClick={() => { if (!pathname.startsWith("/settings")) { setPendingPath("/settings"); setRouteLoading(true); } }}><SettingsIcon aria-hidden="true" /><span>{t("navigation.settings")}</span></Link>
          <Link className={displayedPath.startsWith("/help") ? "active" : ""} href="/help" onClick={() => { if (!pathname.startsWith("/help")) { setPendingPath("/help"); setRouteLoading(true); } }}><HelpIcon aria-hidden="true" /><span>{t("navigation.help")}</span></Link>
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
            <div className="dashboard-language-toggle" role="group" aria-label={t("language")}>
              {languages.map((item) => <button className={language === item.value ? "active" : ""} type="button" aria-label={t("useLanguage", { language: item.label })} aria-pressed={language === item.value} title={item.label} key={item.value} onClick={() => selectLanguage(item.value)}>{item.shortLabel}</button>)}
              <select className="dashboard-language-select" aria-label={t("language")} value={language} onChange={(event) => selectLanguage(event.target.value as AppLanguage)}>
                {languages.map((item) => <option value={item.value} key={item.value}>{item.shortLabel}</option>)}
              </select>
            </div>
            <div className="dashboard-theme-toggle" aria-label={t("theme")}>
              <button className={!dark ? "active" : ""} type="button" aria-label={t("toggleTheme")} aria-pressed={!dark} title={t("toggleTheme")} onClick={toggleTheme}><Sun aria-hidden="true" /></button>
              <button className={dark ? "active" : ""} type="button" aria-label={t("toggleTheme")} aria-pressed={dark} title={t("toggleTheme")} onClick={toggleTheme}><Moon aria-hidden="true" /></button>
            </div>
            <div className="dashboard-notifications">
              <button type="button" aria-label={t("notifications")} aria-expanded={notificationsOpen} onClick={() => { const next = !notificationsOpen; setNotificationsOpen(next); if (next) setNotificationsUnread(false); }}><Bell aria-hidden="true" />{notificationsUnread && <span className="notification-dot" />}</button>
            </div>
            <ProfileMenu user={user} onUserChange={setUser} />
            {notificationsOpen && <div className="notification-popover">
              <div className="notification-popover-header"><strong>{t("todayNotifications")}</strong></div>
              {currencyAlerts.length ? currencyAlerts.map((alert) => <article className={`notification-item ${notificationTone(alert.id)}`} key={alert.id}><span className="notification-item-icon"><NotificationIcon id={alert.id} /></span><div><b>{alert.title}</b><p>{alert.message}</p></div><button className="notification-dismiss" type="button" aria-label={t("dismissNotification", { title: alert.title })} onClick={() => dismissNotification(alert.id)}><X aria-hidden="true" /></button></article>) : <p>{t("noNotifications")}</p>}
            </div>}
          </div>
        </div>
      </header>
      <main className={`dashboard-workspace${displayedPath === "/stock" || displayedPath === "/sales" || displayedPath === "/finance" || displayedPath === "/documents" ? " data-page-workspace" : ""}${displayedPath === "/help" ? " help-page-workspace" : ""}`}>
        {children}
        {routeLoading && <div className="route-loading-screen route-loading-structure"><AppPageSkeleton variant={(["stock", "sales", "finance", "documents", "settings", "help"].includes(displayedPath.slice(1)) ? displayedPath.slice(1) : "dashboard") as "dashboard" | "stock" | "sales" | "finance" | "documents" | "settings" | "help"} label={t("loadingPage")} embedded /></div>}
      </main>
    </section>
  </div></AuthUserProvider>;
}
