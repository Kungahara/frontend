"use client";

import { useEffect, useMemo, useState } from "react";

import { CustomSelect } from "@/components/custom-select";
import { inventoryFetch } from "@/lib/inventory-client";

type Sale = { id: string; productId: string; productName: string; categoryName: string; quantity: number; createdAt: string };
type Period = "1W" | "1M" | "1Y";

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthParts(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

function monthWeekRanges(value: string) {
  const { year, monthIndex } = monthParts(value);
  const days = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: Math.ceil(days / 7) }, (_, index) => {
    const startDay = index * 7 + 1;
    const endDay = Math.min(days, startDay + 6);
    return { startDay, endDay, label: `${new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(year, monthIndex, 1))} ${startDay}–${endDay}` };
  });
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

function niceMaximum(value: number) {
  if (value <= 4) return 4;
  const roughStep = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude * 4;
}

export function SalesAnalytics({ onSettled }: { onSettled?: () => void }) {
  const now = new Date();
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<Period>("1M");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(currentMonthValue());
  const [weekIndex, setWeekIndex] = useState(Math.floor((now.getDate() - 1) / 7));
  const [categoryName, setCategoryName] = useState("all");
  const [productId, setProductId] = useState("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    inventoryFetch("/api/sales", { signal: controller.signal }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error();
      setSales(Array.isArray(body?.sales) ? body.sales : []);
    }).catch((reason) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError("Unable to load sales analytics.");
    }).finally(() => { if (active) { setLoading(false); onSettled?.(); } });
    return () => { active = false; controller.abort(); };
  }, [onSettled]);

  const weeks = monthWeekRanges(month);
  const categories = useMemo(() => [...new Set(sales.map((sale) => sale.categoryName))].sort(), [sales]);
  const products = useMemo(() => {
    const unique = new Map<string, string>();
    sales.filter((sale) => categoryName === "all" || sale.categoryName === categoryName).forEach((sale) => unique.set(sale.productId, sale.productName));
    return [...unique].map(([id, name]) => ({ id, name }));
  }, [sales, categoryName]);
  const points = useMemo(() => {
    const { year: monthYear, monthIndex } = monthParts(month);
    const selectedWeek = weeks[Math.min(weekIndex, weeks.length - 1)] ?? weeks[0];
    const dates = period === "1Y"
      ? Array.from({ length: 12 }, (_, index) => new Date(year, index, 1))
      : period === "1M"
        ? weeks.map((week) => new Date(monthYear, monthIndex, week.startDay))
        : Array.from({ length: selectedWeek.endDay - selectedWeek.startDay + 1 }, (_, index) => new Date(monthYear, monthIndex, selectedWeek.startDay + index));
    return dates.map((date, index) => {
      const end = period === "1Y" ? new Date(year, index + 1, 1) : period === "1M" ? new Date(monthYear, monthIndex, (weeks[index]?.endDay ?? date.getDate()) + 1) : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      const value = sales.filter((sale) => {
        const sold = new Date(sale.createdAt);
        return sold >= date && sold < end && (categoryName === "all" || sale.categoryName === categoryName) && (productId === "all" || sale.productId === productId);
      }).reduce((sum, sale) => sum + sale.quantity, 0);
      const label = period === "1Y" ? new Intl.DateTimeFormat("en", { month: "short" }).format(date) : period === "1M" ? `Week ${index + 1}` : new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric" }).format(date);
      return { label, value };
    });
  }, [sales, period, year, month, weekIndex, weeks, categoryName, productId]);

  const maximum = niceMaximum(Math.max(...points.map((point) => point.value), 0));
  const x = (index: number) => 58 + (index / Math.max(1, points.length - 1)) * 468;
  const y = (value: number) => 190 - (value / maximum) * 145;
  const coordinates = points.map((point, index) => [x(index), y(point.value)] as [number, number]);
  const line = smoothLinePath(coordinates);
  const hoveredPoint = hoveredIndex === null ? null : points[hoveredIndex];
  const tooltipX = hoveredIndex === null ? 0 : Math.min(390, Math.max(62, x(hoveredIndex) - 68));
  const tooltipY = hoveredPoint ? Math.max(6, y(hoveredPoint.value) - 66) : 0;

  const selectedProductName = productId === "all" ? categoryName === "all" ? "All items" : `All in ${categoryName}` : products.find((product) => product.id === productId)?.name ?? "Selected item";

  return <div className="stock-analysis-replacement sales-analytics-layout">
    <section className="stock-profit-section sales-analytics-panel" aria-labelledby="sales-analytics-title">
    <header><div><h2 id="sales-analytics-title">Items sold over time</h2><p>{selectedProductName} · Actual sales quantities</p></div></header>
    <div className="stock-analysis-meta"><div className="stock-analysis-legend sales-items-legend"><span>Items sold</span></div><div className="stock-period-controls">
      {period === "1Y" && <label className="stock-period-field"><span>Year</span><input type="number" min="2000" max="2100" value={year} onChange={(event) => setYear(Number(event.target.value) || now.getFullYear())} /></label>}
      {period !== "1Y" && <label className="stock-period-field"><span>Month</span><input type="month" value={month} onChange={(event) => { if (event.target.value) { setMonth(event.target.value); setWeekIndex(0); } }} /></label>}
      {period === "1W" && <CustomSelect className="stock-period-field" label="Week" value={String(Math.min(weekIndex, weeks.length - 1))} options={weeks.map((week, index) => ({ label: week.label, value: String(index) }))} onChange={(value) => setWeekIndex(Number(value))} />}
      <div className="stock-period-buttons" aria-label="Analytics period">{(["1W", "1M", "1Y"] as Period[]).map((value) => <button className={period === value ? "active" : ""} type="button" key={value} onClick={() => setPeriod(value)}>{{ "1W": "Week", "1M": "Month", "1Y": "Year" }[value]}</button>)}</div>
    </div></div>
    {error && <p className="stock-product-error" role="alert">{error}</p>}
    <div className={`stock-analysis-chart sales-items-chart${loading ? " loading" : ""}`}><svg viewBox="0 0 560 225" role="img" aria-label="Items sold in the selected period" onMouseLeave={() => setHoveredIndex(null)}>
      <defs><linearGradient id="sales-items-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--app-blue)" stopOpacity="0.28" /><stop offset="1" stopColor="var(--app-blue)" stopOpacity="0.02" /></linearGradient></defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <g key={ratio}><line x1="58" x2="526" y1={190 - ratio * 145} y2={190 - ratio * 145} /><text x="49" y={194 - ratio * 145} textAnchor="end">{Math.round(maximum * ratio)}</text></g>)}
      <line className="stock-axis" x1="58" x2="58" y1="45" y2="190" /><line className="stock-axis" x1="58" x2="526" y1="190" y2="190" />
      {points.map((point, index) => <text x={x(index)} y="209" textAnchor="middle" key={point.label}>{point.label}</text>)}
      <text className="stock-axis-label" x="14" y="116" textAnchor="middle" transform="rotate(-90 14 116)">Items sold</text>
      <path className="sales-items-area" d={`${line} L 526 190 L 58 190 Z`} /><path className="stock-chart-line sales-items-line" pathLength="1" d={line} />
      {points.map((point, index) => <g className="sales-items-point-group" key={`point-${point.label}`} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}><circle className="sales-items-point-hit" cx={x(index)} cy={y(point.value)} r="15" /><circle className="sales-items-point-ring" cx={x(index)} cy={y(point.value)} r="5.5" /><circle className="sales-items-point-core" cx={x(index)} cy={y(point.value)} r="2.5" /></g>)}
      {hoveredPoint && <g className="stock-chart-tooltip sales-items-tooltip" pointerEvents="none"><rect x={tooltipX} y={tooltipY} width="136" height="52" rx="8" /><text x={tooltipX + 11} y={tooltipY + 20}>{hoveredPoint.label}</text><text className="value" x={tooltipX + 11} y={tooltipY + 40}>{hoveredPoint.value} items sold</text></g>}
    </svg>{loading && <span className="sales-chart-skeleton" aria-hidden="true" />}</div>
    </section>
    <aside className="stock-product-section" aria-labelledby="sales-items-title"><header><h2 id="sales-items-title">Items</h2><p>Choose what to show on the graph.</p></header><div className="stock-product-choice">
      <button className={productId === "all" ? "active" : ""} type="button" onClick={() => setProductId("all")}><span>{categoryName === "all" ? "All items" : `All in ${categoryName}`}</span></button>
      {loading ? Array.from({ length: 5 }, (_, item) => <span className="analytics-option-skeleton" aria-hidden="true" key={item} />) : products.map((product) => <button className={productId === product.id ? "active" : ""} type="button" key={product.id} onClick={() => setProductId(product.id)}><span>{product.name}</span></button>)}
    </div></aside>
    <aside className="stock-category-section" aria-labelledby="sales-categories-title"><header><h2 id="sales-categories-title">Categories</h2><p>Choose a category to analyze.</p></header><div className="stock-category-list">
      <button className={categoryName === "all" ? "active" : ""} type="button" onClick={() => { setCategoryName("all"); setProductId("all"); }}><span>All categories</span></button>
      {loading ? Array.from({ length: 5 }, (_, item) => <span className="analytics-option-skeleton" aria-hidden="true" key={item} />) : categories.map((category) => <button className={categoryName === category ? "active" : ""} type="button" key={category} onClick={() => { setCategoryName(category); setProductId("all"); }}><span>{category}</span></button>)}
    </div></aside>
  </div>;
}
