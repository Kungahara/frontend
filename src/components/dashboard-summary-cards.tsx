"use client";

import { ArrowRight, BadgeDollarSign, Coins, ShoppingBag, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { inventoryFetch } from "@/lib/inventory-client";

type Product = { id: string; name: string; quantity: number; costPrice: string; sellingPrice: string };
type Sale = { productId: string; quantity: number; unitPrice: string; createdAt: string };
type Movement = { productId: string; type: string; quantity: number; createdAt: string };
type DashboardScope = "today" | "month" | "year";

const salesMoney = (value: number) => `RWF ${new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(value)}`;

function DashboardMoney({ value, currencyFirst = true }: { value: number; currencyFirst?: boolean }) {
  const full = new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(value);
  const compact = new Intl.NumberFormat("en", { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(value);
  return <><span className="dashboard-money-full">{currencyFirst ? `RWF ${full}` : `${full} RWF`}</span><span className="dashboard-money-compact">{currencyFirst ? `RWF ${compact}` : `${compact} RWF`}</span></>;
}

function inDashboardScope(value: string, scope: DashboardScope) {
  const date = new Date(value), now = new Date();
  if (date.getFullYear() !== now.getFullYear()) return false;
  if (scope === "year") return true;
  if (date.getMonth() !== now.getMonth()) return false;
  return scope === "month" || date.getDate() === now.getDate();
}

function SellingItemCard({ title, product, percentage, tone }: { title: string; product?: Product; percentage: number; tone: "best" | "least" }) {
  return <article className={`stock-summary-card selling-summary-card ${tone}`} aria-label={title}>
    <span className="stock-summary-title">{title}</span>
    <span className="stock-summary-icon selling-summary-icon"><ShoppingBag aria-hidden="true" /></span>
    <div className="stock-summary-value-row"><strong>{new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(percentage)}%</strong><span className="selling-item-name">{product?.name || "No sales yet"}</span></div>
    <span className="stock-summary-previous">Remaining Stock: <strong>{new Intl.NumberFormat("en").format(product?.quantity ?? 0)}</strong></span>
  </article>;
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
      return { label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date), sales: daySales.reduce((total, sale) => total + sale.quantity, 0), income, expense };
    });
  }, [products, sales]);
  const values = view === "sales" ? points.map((point) => point.sales) : points.flatMap((point) => [point.income, point.expense]);
  const rawMinimum = Math.min(0, ...values), rawMaximum = Math.max(1, ...values);
  const axisLimit = niceAxisLimit(Math.max(Math.abs(rawMinimum), Math.abs(rawMaximum)));
  const minimum = rawMinimum < 0 ? -axisLimit : 0, maximum = axisLimit, range = maximum - minimum;
  const x = (index: number) => 50 + (index / Math.max(1, points.length - 1)) * 470;
  const y = (value: number) => 180 - ((value - minimum) / range) * 135;
  const formatAxisValue = (value: number) => view === "sales" ? new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value) : new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  const path = (key: "sales" | "income" | "expense") => smoothLinePath(points.map((point, index) => [x(index), y(point[key])]));
  const hoveredPoint = hovered ? points[hovered.index] : null;
  const hoveredValue = hoveredPoint && hovered ? hoveredPoint[hovered.series] : 0;
  const tooltipWidth = 142;
  const tooltipX = hovered ? Math.min(414, Math.max(50, x(hovered.index) - tooltipWidth / 2)) : 0;
  const tooltipY = hovered ? Math.max(4, y(hoveredValue) - 62) : 0;
  const seriesLabel = hovered?.series === "sales" ? "Items sold" : hovered?.series === "income" ? "Income" : "Expenses";
  const tooltipValue = hovered?.series === "sales" ? `${hoveredValue} items sold` : salesMoney(hoveredValue);

  return <section className="dashboard-graph-panel" aria-label={view === "sales" ? "General sales graph" : "Income and expenses graph"}>
    <header><nav className="sales-view-tabs" aria-label="Dashboard graphs"><button className={view === "finance" ? "active" : ""} type="button" aria-pressed={view === "finance"} onClick={() => { setView("finance"); setHovered(null); }}>Income &amp; expenses</button><button className={view === "sales" ? "active" : ""} type="button" aria-pressed={view === "sales"} onClick={() => { setView("sales"); setHovered(null); }}>Sales</button></nav><Link className="dashboard-continue-button" href={view === "sales" ? "/sales?view=analytics" : "/stock?view=analysis"}>Continue to page <ArrowRight /></Link></header>
    <div className="stock-analysis-meta"><div className="stock-analysis-legend dashboard-graph-legend">{view === "sales" ? <span className="sales">Items sold</span> : <><span className="income">Income</span><span className="expenses">Expenses</span></>}</div></div>
    <div className="stock-analysis-chart dashboard-general-chart"><svg viewBox="0 0 560 215" role="img" aria-label={view === "sales" ? "Items sold over the last seven days" : "Income and expenses over the last seven days"} onMouseLeave={() => setHovered(null)}>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => { const value = minimum + range * ratio, lineY = y(value); return <g key={ratio}><line x1="50" x2="520" y1={lineY} y2={lineY} /><text x="43" y={lineY + 3} textAnchor="end">{formatAxisValue(value)}</text></g>; })}
      <line className="stock-axis" x1="50" x2="50" y1="45" y2="180" /><line className="stock-axis" x1="50" x2="520" y1="180" y2="180" />
      {points.map((point, index) => <text x={x(index)} y="200" textAnchor="middle" key={point.label}>{point.label}</text>)}
      <text className="stock-axis-label dashboard-axis-label" x="13" y="112" textAnchor="middle" transform="rotate(-90 13 112)">{view === "sales" ? "Items sold" : "Amount (RWF)"}</text>
      {view === "sales" ? <path className="stock-chart-line dashboard-sales-line" d={path("sales")} /> : <><path className="stock-chart-line dashboard-income-line" d={path("income")} /><path className="stock-chart-line dashboard-expense-line" d={path("expense")} /></>}
      {points.map((point, index) => view === "sales" ? <g className="dashboard-chart-point dashboard-sales-point" key={point.label} onMouseEnter={() => setHovered({ index, series: "sales" })} onMouseLeave={() => setHovered(null)}><circle className="dashboard-chart-point-hit" cx={x(index)} cy={y(point.sales)} r="15" /><circle className="dashboard-chart-point-ring" cx={x(index)} cy={y(point.sales)} r="5.5" /><circle className="dashboard-chart-point-core" cx={x(index)} cy={y(point.sales)} r="2.5" /></g> : <g key={point.label}><g className="dashboard-chart-point dashboard-income-point" onMouseEnter={() => setHovered({ index, series: "income" })} onMouseLeave={() => setHovered(null)}><circle className="dashboard-chart-point-hit" cx={x(index)} cy={y(point.income)} r="14" /><circle className="dashboard-chart-point-ring" cx={x(index)} cy={y(point.income)} r="5.5" /><circle className="dashboard-chart-point-core" cx={x(index)} cy={y(point.income)} r="2.5" /></g><g className="dashboard-chart-point dashboard-expense-point" onMouseEnter={() => setHovered({ index, series: "expense" })} onMouseLeave={() => setHovered(null)}><circle className="dashboard-chart-point-hit" cx={x(index)} cy={y(point.expense)} r="14" /><circle className="dashboard-chart-point-ring" cx={x(index)} cy={y(point.expense)} r="5.5" /><circle className="dashboard-chart-point-core" cx={x(index)} cy={y(point.expense)} r="2.5" /></g></g>)}
      {hoveredPoint && hovered && <g className="stock-chart-tooltip dashboard-graph-tooltip" pointerEvents="none"><rect x={tooltipX} y={tooltipY} width={tooltipWidth} height="52" rx="8" /><text x={tooltipX + 11} y={tooltipY + 18}>{hoveredPoint.label} · {seriesLabel}</text><text className="value" x={tooltipX + 11} y={tooltipY + 39}>{tooltipValue}</text></g>}
    </svg></div>
  </section>;
}

export function DashboardSummaryCards() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
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
        const responses = await Promise.all(["/api/products", "/api/sales", "/api/stock-movements"].map((path) => inventoryFetch(path, { signal: controller.signal })));
        const bodies = await Promise.all(responses.map((response) => response.json().catch(() => null)));
        if (responses.some((response) => !response.ok)) throw new Error("Unable to load dashboard summary.");
        if (!active) return;
        setProducts(bodies[0]?.products ?? []); setSales(bodies[1]?.sales ?? []); setMovements(bodies[2]?.stockMovements ?? []); setError("");
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

  if (loading) return <section className="stock-data-body dashboard-summary-body dashboard-summary-loading"><div className="sales-page-loading" role="status" aria-live="polite"><span aria-hidden="true" /><strong>Loading finance data…</strong><small>Calculating your business finances.</small></div></section>;
  if (error) return <section className="stock-data-body dashboard-summary-body dashboard-summary-loading"><div className="sales-page-loading" role="alert"><strong>Unable to load the dashboard.</strong><small>{error}</small></div></section>;

  const costs = new Map(products.map((product) => [product.id, Number(product.costPrice)]));
  const selectedSales = sales.filter((sale) => inDashboardScope(sale.createdAt, scope));
  const invested = movements.filter((movement) => movement.type === "stock_in" && movement.quantity > 0 && inDashboardScope(movement.createdAt, scope)).reduce((total, movement) => total + movement.quantity * (costs.get(movement.productId) ?? 0), 0);
  const income = selectedSales.reduce((total, sale) => total + sale.quantity * Number(sale.unitPrice), 0);
  const costOfSales = selectedSales.reduce((total, sale) => total + sale.quantity * (costs.get(sale.productId) ?? 0), 0);
  const profit = income - costOfSales;
  const losses = selectedSales.reduce((total, sale) => total + Math.max(0, (costs.get(sale.productId) ?? 0) - Number(sale.unitPrice)) * sale.quantity, 0);
  const stockValue = products.reduce((total, product) => total + product.quantity * Number(product.costPrice), 0);
  const expectedIncome = products.reduce((total, product) => total + product.quantity * Number(product.sellingPrice), 0);
  const scopedMovementValue = movements.filter((movement) => inDashboardScope(movement.createdAt, scope)).reduce((total, movement) => total + movement.quantity * (costs.get(movement.productId) ?? 0), 0);
  const lastMonthStockValue = Math.max(0, stockValue - scopedMovementValue);
  const stockValueChange = lastMonthStockValue ? ((stockValue - lastMonthStockValue) / lastMonthStockValue) * 100 : stockValue > 0 ? 100 : 0;
  const StockValueChangeIcon = stockValueChange >= 0 ? TrendingUp : TrendingDown;
  const rankedProducts = products.map((product) => {
    const sold = sales.filter((sale) => sale.productId === product.id).reduce((total, sale) => total + sale.quantity, 0);
    const supplied = movements.filter((movement) => movement.productId === product.id && movement.type === "stock_in").reduce((total, movement) => total + movement.quantity, 0);
    return { product, sold, percentage: sold ? Math.min(100, (sold / (supplied || product.quantity + sold)) * 100) : 0 };
  }).sort((first, second) => second.sold - first.sold);
  const mostSelling = rankedProducts[0];
  const leastSelling = rankedProducts.length > 1 ? rankedProducts[rankedProducts.length - 1] : rankedProducts[0];
  const scopeWords = scope === "today" ? "today" : scope === "year" ? "this year" : "this month";

  return <section className="stock-data-body dashboard-summary-body" aria-label="Dashboard financial summary">
    <div className="finance-summary-grid">
      <article className="stock-summary-card finance-summary-card blue stock-value-card"><span className="stock-summary-title">Money invested {scopeWords}</span><span className="stock-summary-icon finance-card-icon"><Coins aria-hidden="true" /></span><div className="stock-value-amount"><DashboardMoney value={invested} currencyFirst={false} /></div><span className="historical-card-note">Stock purchased</span></article>
      <article className="stock-summary-card finance-summary-card green"><span className="stock-summary-title">Income {scopeWords}</span><span className="stock-summary-icon finance-card-icon"><BadgeDollarSign aria-hidden="true" /></span><div className="stock-summary-value-row"><strong><DashboardMoney value={income} currencyFirst={false} /></strong></div><span className="stock-summary-previous">Money from sales</span></article>
      <article className="stock-summary-card finance-summary-card profit"><span className="stock-summary-title">Profit {scopeWords}</span><span className="stock-summary-icon finance-card-icon"><WalletCards aria-hidden="true" /></span><div className="stock-summary-value-row"><strong><DashboardMoney value={profit} currencyFirst={false} /></strong></div><span className="stock-summary-previous">Profit made {scopeWords}</span></article>
      <article className="stock-summary-card finance-summary-card least-stock-card sales-loss-card"><span className="stock-summary-title">Losses suffered</span><span className="stock-summary-icon least-stock-icon"><TrendingDown aria-hidden="true" /></span><div className="stock-value-amount"><DashboardMoney value={losses} /></div><span className="least-stock-remaining">Money lost {scopeWords}</span></article>
    </div>
    <div className="dashboard-lower-content">
    <DashboardGraph products={products} sales={sales} />
    <div className="dashboard-stock-summary-grid">
      <article className="stock-summary-card stock-value-card" aria-label="Stock value"><span className="stock-summary-title">Stock value</span><span className="stock-summary-icon stock-value-icon"><Coins aria-hidden="true" /></span><div className="stock-value-amount"><DashboardMoney value={stockValue} /></div><div className="stock-value-comparison"><span className={`stock-summary-change${stockValueChange >= 0 ? " increase" : " decrease"}`}><StockValueChangeIcon aria-hidden="true" />{new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(Math.abs(stockValueChange))}%</span><span>than last month</span></div></article>
      <article className="stock-summary-card" aria-label="Expected income from stock"><span className="stock-summary-title">Expected income</span><span className="stock-summary-icon stock-status-icon"><BadgeDollarSign aria-hidden="true" /></span><div className="stock-summary-value-row"><strong><DashboardMoney value={expectedIncome} /></strong></div><span className="stock-summary-previous">If all current stock is sold</span></article>
      <SellingItemCard title="Most selling item in stock" product={mostSelling?.product} percentage={mostSelling?.percentage ?? 0} tone="best" />
      <SellingItemCard title="Least selling item in stock" product={leastSelling?.product} percentage={leastSelling?.percentage ?? 0} tone="least" />
    </div>
    </div>
  </section>;
}
