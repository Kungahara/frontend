"use client";

import { ArrowRight, BadgeDollarSign, Coins, TrendingDown, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { AppPageSkeleton } from "@/components/app-page-skeleton";
import { MoneyAmount } from "@/components/money-amount";
import { inventoryFetch } from "@/lib/inventory-client";
import { formatRwf } from "@/lib/format-money";
import { PersonAvatar, type PersonSummary } from "@/components/person-avatar";

type Product = { id: string; name: string; quantity: number; costPrice: string; sellingPrice: string };
type Sale = { productId: string; quantity: number; unitPrice: string; createdAt: string };
type Movement = { productId: string; type: string; quantity: number; createdAt: string };
type DashboardScope = "today" | "month" | "year";
type MemberActivity = { id: string; actor: PersonSummary; action: string; entityType: string; count: number; items: string[]; happenedAt: string };

function DashboardMoney({ value }: { value: number }) {
  return <MoneyAmount value={value} />;
}

function inDashboardScope(value: string, scope: DashboardScope) {
  const date = new Date(value), now = new Date();
  if (date.getFullYear() !== now.getFullYear()) return false;
  if (scope === "year") return true;
  if (date.getMonth() !== now.getMonth()) return false;
  return scope === "month" || date.getDate() === now.getDate();
}

function MemberActivityList({ activities }: { activities: MemberActivity[] }) {
  const locale = useLocale();
  const actionCopy: Record<string, Record<string, string>> = {
    fr: { added: "a ajouté", invited: "a invité", updated: "a modifié", recorded: "a enregistré", edited: "a modifié", uploaded: "a téléversé", removed: "a supprimé", restocked: "a réapprovisionné", "adjusted stock for": "a ajusté le stock de" },
    rw: { added: "yongeyemo", invited: "yatumiye", updated: "yahinduye", recorded: "yanditse", edited: "yahinduye", uploaded: "yohereje", removed: "yakuyeho", restocked: "yongeye ibicuruzwa bya", "adjusted stock for": "yahinduye ububiko bwa" },
  };
  const entityCopy: Record<string, Record<string, string>> = {
    fr: { member: "membres", product: "produits", sale: "ventes", loan: "prêts", document: "documents", stock: "mouvements de stock" },
    rw: { member: "abanyamuryango", product: "ibicuruzwa", sale: "ibyagurishijwe", loan: "imyenda", document: "inyandiko", stock: "impinduka z’ububiko" },
  };
  return <aside className="dashboard-member-activity" aria-label="Members activity">
    <header><span><Users /></span><div><strong>Members activity</strong><small>Similar actions are grouped together.</small></div></header>
    <div className="dashboard-member-activity-list">
      {activities.map((activity) => {
        const action = actionCopy[locale]?.[activity.action] ?? activity.action;
        const groupedLabel = locale === "en" ? `${activity.count} ${activity.entityType} records` : `${activity.count} ${entityCopy[locale]?.[activity.entityType] ?? activity.entityType}`;
        return <article key={activity.id}><PersonAvatar person={activity.actor} /><div><p><strong>{activity.actor.firstName || activity.actor.email}</strong> {action} {activity.count > 1 ? groupedLabel : activity.items[0] || activity.entityType}</p>{activity.count > 1 && activity.items.length > 0 && <small>{activity.items.join(", ")}</small>}<time dateTime={activity.happenedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.happenedAt))}</time></div></article>;
      })}
      {!activities.length && <div className="dashboard-member-activity-empty"><Users /><strong>No member activity yet</strong><small>New stock, sales, finance, and document actions will appear here.</small></div>}
    </div>
  </aside>;
}

function sameDay(value: string, date: Date) {
  const candidate = new Date(value);
  return candidate.getFullYear() === date.getFullYear() && candidate.getMonth() === date.getMonth() && candidate.getDate() === date.getDate();
}

function smoothLinePath(points: Array<[number, number]>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  const widths = points.slice(0, -1).map((point, index) => points[index + 1][0] - point[0]);
  const slopes = widths.map((width, index) => (points[index + 1][1] - points[index][1]) / width);
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    const left = slopes[index - 1], right = slopes[index];
    if (left === 0 || right === 0 || Math.sign(left) !== Math.sign(right)) return 0;
    const leftWeight = 2 * widths[index] + widths[index - 1];
    const rightWeight = widths[index] + 2 * widths[index - 1];
    return (leftWeight + rightWeight) / (leftWeight / left + rightWeight / right);
  });
  return points.slice(0, -1).reduce((path, point, index) => {
    const next = points[index + 1], width = widths[index];
    return `${path} C ${point[0] + width / 3} ${point[1] + tangents[index] * width / 3}, ${next[0] - width / 3} ${next[1] - tangents[index + 1] * width / 3}, ${next[0]} ${next[1]}`;
  }, `M ${points[0][0]} ${points[0][1]}`);
}

function niceAxisLimit(value: number) {
  if (value <= 0) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const multiplier = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((candidate) => candidate >= normalized) ?? 10;
  return multiplier * magnitude;
}

function DashboardGraph({ products, sales }: { products: Product[]; sales: Sale[] }) {
  const t = useTranslations("Dashboard.graph");
  const locale = useLocale();
  const [view, setView] = useState<"sales" | "finance">("finance");
  const [hovered, setHovered] = useState<{ index: number; series: "sales" | "income" | "expense" } | null>(null);
  const points = useMemo(() => {
    const costs = new Map(products.map((product) => [product.id, Number(product.costPrice)]));
    const now = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index);
      const daySales = sales.filter((sale) => sameDay(sale.createdAt, date));
      const income = daySales.reduce((total, sale) => total + sale.quantity * Number(sale.unitPrice), 0);
      const expense = daySales.reduce((total, sale) => total + sale.quantity * (costs.get(sale.productId) ?? 0), 0);
      return { label: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date), sales: daySales.reduce((total, sale) => total + sale.quantity, 0), income, expense };
    });
  }, [locale, products, sales]);
  const values = view === "sales" ? points.map((point) => point.sales) : points.flatMap((point) => [point.income, point.expense]);
  const rawMinimum = Math.min(0, ...values), rawMaximum = Math.max(1, ...values);
  const axisLimit = niceAxisLimit(Math.max(Math.abs(rawMinimum), Math.abs(rawMaximum)));
  const minimum = rawMinimum < 0 ? -axisLimit : 0, maximum = axisLimit, range = maximum - minimum;
  const x = (index: number) => 50 + (index / Math.max(1, points.length - 1)) * 470;
  const y = (value: number) => 180 - ((value - minimum) / range) * 135;
  const formatAxisValue = (value: number) => view === "sales" ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value) : new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
  const path = (key: "sales" | "income" | "expense") => smoothLinePath(points.map((point, index) => [x(index), y(point[key])]));
  const financeSeriesOverlap = points.every((point) => Math.abs(point.income - point.expense) < 0.01);
  const hoveredPoint = hovered ? points[hovered.index] : null;
  const hoveredValue = hoveredPoint && hovered ? hoveredPoint[hovered.series] : 0;
  const tooltipWidth = 142;
  const tooltipX = hovered ? Math.min(414, Math.max(50, x(hovered.index) - tooltipWidth / 2)) : 0;
  const tooltipY = hovered ? Math.max(4, y(hoveredValue) - 62) : 0;
  const seriesLabel = hovered?.series === "sales" ? t("itemsSold") : hovered?.series === "income" ? t("income") : t("expenses");
  const tooltipValue = hovered?.series === "sales" ? t("itemsSoldValue", { count: hoveredValue }) : formatRwf(hoveredValue);

  return <section className="dashboard-graph-panel" aria-label={view === "sales" ? t("salesGraphLabel") : t("financeGraphLabel")}>
    <header><nav className="sales-view-tabs" aria-label={t("graphsLabel")}><button className={view === "finance" ? "active" : ""} type="button" aria-pressed={view === "finance"} onClick={() => { setView("finance"); setHovered(null); }}>{t("financeTab")}</button><button className={view === "sales" ? "active" : ""} type="button" aria-pressed={view === "sales"} onClick={() => { setView("sales"); setHovered(null); }}>{t("salesTab")}</button></nav><Link className="dashboard-continue-button" href={view === "sales" ? "/sales?view=analytics" : "/stock?view=analysis"}>{t("continue")} <ArrowRight /></Link></header>
    <div className="stock-analysis-meta"><div className="stock-analysis-legend dashboard-graph-legend">{view === "sales" ? <span className="sales">{t("itemsSold")}</span> : <><span className="income">{t("income")}</span><span className="expenses">{t("expenses")}</span></>}</div></div>
    <div className="stock-analysis-chart dashboard-general-chart"><svg viewBox="0 0 560 215" role="img" aria-label={view === "sales" ? t("salesSevenDaysLabel") : t("financeSevenDaysLabel")} onMouseLeave={() => setHovered(null)}>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => { const value = minimum + range * ratio, lineY = y(value); return <g key={ratio}><line x1="50" x2="520" y1={lineY} y2={lineY} /><text x="43" y={lineY + 3} textAnchor="end">{formatAxisValue(value)}</text></g>; })}
      <line className="stock-axis" x1="50" x2="50" y1="45" y2="180" /><line className="stock-axis" x1="50" x2="520" y1="180" y2="180" />
      {points.map((point, index) => <text x={x(index)} y="200" textAnchor="middle" key={point.label}>{point.label}</text>)}
      <text className="stock-axis-label dashboard-axis-label" x="13" y="112" textAnchor="middle" transform="rotate(-90 13 112)">{view === "sales" ? t("itemsSold") : t("amount")}</text>
      {view === "sales" ? <path className="stock-chart-line dashboard-sales-line" pathLength="1" d={path("sales")} /> : <><path className={`stock-chart-line dashboard-expense-line${financeSeriesOverlap ? " overlapping" : ""}`} pathLength="1" d={path("expense")} /><path className="stock-chart-line dashboard-income-line" pathLength="1" d={path("income")} /></>}
      {points.map((point, index) => view === "sales" ? <g className="dashboard-chart-point dashboard-sales-point" key={point.label} onMouseEnter={() => setHovered({ index, series: "sales" })} onMouseLeave={() => setHovered(null)}><circle className="dashboard-chart-point-hit" cx={x(index)} cy={y(point.sales)} r="15" /><circle className="dashboard-chart-point-ring" cx={x(index)} cy={y(point.sales)} r="5.5" /><circle className="dashboard-chart-point-core" cx={x(index)} cy={y(point.sales)} r="2.5" /></g> : <g key={point.label}><g className="dashboard-chart-point dashboard-income-point" onMouseEnter={() => setHovered({ index, series: "income" })} onMouseLeave={() => setHovered(null)}><circle className="dashboard-chart-point-hit" cx={x(index)} cy={y(point.income)} r="14" /><circle className="dashboard-chart-point-ring" cx={x(index)} cy={y(point.income)} r="5.5" /><circle className="dashboard-chart-point-core" cx={x(index)} cy={y(point.income)} r="2.5" /></g><g className="dashboard-chart-point dashboard-expense-point" onMouseEnter={() => setHovered({ index, series: "expense" })} onMouseLeave={() => setHovered(null)}><circle className="dashboard-chart-point-hit" cx={x(index)} cy={y(point.expense)} r="14" /><circle className="dashboard-chart-point-ring" cx={x(index)} cy={y(point.expense)} r="5.5" /><circle className="dashboard-chart-point-core" cx={x(index)} cy={y(point.expense)} r="2.5" /></g></g>)}
      {hoveredPoint && hovered && <g className="stock-chart-tooltip dashboard-graph-tooltip" pointerEvents="none"><rect x={tooltipX} y={tooltipY} width={tooltipWidth} height="52" rx="8" /><text x={tooltipX + 11} y={tooltipY + 18}>{hoveredPoint.label} · {seriesLabel}</text><text className="value" x={tooltipX + 11} y={tooltipY + 39}>{tooltipValue}</text></g>}
    </svg></div>
  </section>;
}

export function DashboardSummaryCards() {
  const loadingText = useTranslations("Loading");
  const t = useTranslations("Dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [activities, setActivities] = useState<MemberActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scope, setScope] = useState<DashboardScope>(() => {
    if (typeof window === "undefined") return "month";
    const saved = window.localStorage.getItem("kungahara:dashboard-scope");
    return saved === "today" || saved === "year" ? saved : "month";
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const responses = await Promise.all(["/api/products", "/api/sales", "/api/stock-movements", "/api/team/activity"].map((path) => inventoryFetch(path, { signal: controller.signal })));
        const bodies = await Promise.all(responses.map((response) => response.json().catch(() => null)));
        if (responses.some((response) => !response.ok)) throw new Error("Unable to load dashboard summary.");
        if (!active) return;
        setProducts(bodies[0]?.products ?? []); setSales(bodies[1]?.sales ?? []); setMovements(bodies[2]?.stockMovements ?? []); setActivities(bodies[3]?.activities ?? []); setError("");
      } catch (reason) {
        if (active && !(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Unable to load dashboard summary.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    window.addEventListener("kungahara:inventory-changed", load);
    window.addEventListener("kungahara:data-changed", load);
    return () => { active = false; controller.abort(); window.removeEventListener("kungahara:inventory-changed", load); window.removeEventListener("kungahara:data-changed", load); };
  }, []);

  useEffect(() => {
    function updateScope(event: Event) {
      const next = (event as CustomEvent<{ scope?: DashboardScope }>).detail?.scope;
      if (next === "today" || next === "month" || next === "year") setScope(next);
    }
    window.addEventListener("kungahara:settings-changed", updateScope);
    return () => window.removeEventListener("kungahara:settings-changed", updateScope);
  }, []);

  if (loading) return <section className="stock-data-body dashboard-summary-body dashboard-summary-loading"><AppPageSkeleton variant="dashboard" label={loadingText("dashboard")} embedded /></section>;
  if (error) return <section className="stock-data-body dashboard-summary-body dashboard-summary-loading"><div className="sales-page-loading" role="alert"><strong>{loadingText("dashboardError")}</strong><small>{loadingText("summaryErrorBody")}</small></div></section>;

  const costs = new Map(products.map((product) => [product.id, Number(product.costPrice)]));
  const selectedSales = sales.filter((sale) => inDashboardScope(sale.createdAt, scope));
  const invested = movements.filter((movement) => movement.type === "stock_in" && movement.quantity > 0 && inDashboardScope(movement.createdAt, scope)).reduce((total, movement) => total + movement.quantity * (costs.get(movement.productId) ?? 0), 0);
  const income = selectedSales.reduce((total, sale) => total + sale.quantity * Number(sale.unitPrice), 0);
  const costOfSales = selectedSales.reduce((total, sale) => total + sale.quantity * (costs.get(sale.productId) ?? 0), 0);
  const profit = income - costOfSales;
  const losses = selectedSales.reduce((total, sale) => total + Math.max(0, (costs.get(sale.productId) ?? 0) - Number(sale.unitPrice)) * sale.quantity, 0);
  const scopeWords = t(`scope.${scope}`);

  return <section className="stock-data-body dashboard-summary-body" aria-label={t("summaryLabel")}>
    <div className="finance-summary-grid">
      <article className="stock-summary-card finance-summary-card blue stock-value-card"><span className="stock-summary-title">{t("cards.moneyInvested", { scope: scopeWords })}</span><span className="stock-summary-icon finance-card-icon"><Coins aria-hidden="true" /></span><div className="stock-value-amount"><DashboardMoney value={invested} /></div><span className="historical-card-note">{t("cards.stockPurchased")}</span></article>
      <article className="stock-summary-card finance-summary-card green"><span className="stock-summary-title">{t("cards.income", { scope: scopeWords })}</span><span className="stock-summary-icon finance-card-icon"><BadgeDollarSign aria-hidden="true" /></span><div className="stock-summary-value-row"><strong><DashboardMoney value={income} /></strong></div><span className="stock-summary-previous">{t("cards.moneyFromSales")}</span></article>
      <article className="stock-summary-card finance-summary-card profit"><span className="stock-summary-title">{t("cards.profit", { scope: scopeWords })}</span><span className="stock-summary-icon finance-card-icon"><WalletCards aria-hidden="true" /></span><div className="stock-summary-value-row"><strong><DashboardMoney value={profit} /></strong></div><span className="stock-summary-previous">{t("cards.profitMade", { scope: scopeWords })}</span></article>
      <article className="stock-summary-card finance-summary-card least-stock-card sales-loss-card"><span className="stock-summary-title">{t("cards.lossesSuffered")}</span><span className="stock-summary-icon least-stock-icon"><TrendingDown aria-hidden="true" /></span><div className="stock-value-amount"><DashboardMoney value={losses} /></div><span className="least-stock-remaining">{t("cards.moneyLost", { scope: scopeWords })}</span></article>
    </div>
    <div className="dashboard-lower-content">
    <DashboardGraph products={products} sales={sales} />
    <MemberActivityList activities={activities} />
    </div>
  </section>;
}
