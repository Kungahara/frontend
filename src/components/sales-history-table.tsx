"use client";

import { BadgeDollarSign, ClipboardList, Coins, Search } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { CustomSelect } from "@/components/custom-select";
import { StockStatusIcon } from "@/components/stock-summary-card";
import { inventoryFetch } from "@/lib/inventory-client";

type Sale = { id: string; productName: string; categoryName: string; size: string; quantity: number; unitPrice: string; total: string; createdAt: string };
type Period = "1D" | "1W" | "1M" | "1Y";

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

const money = (value: number) => `${new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(value)} RWF`;

export function SalesHistoryTable({ navigation }: { navigation?: ReactNode }) {
  const now = new Date();
  const [sales, setSales] = useState<Sale[]>([]);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("1M");
  const [day, setDay] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(currentMonthValue());
  const [weekIndex, setWeekIndex] = useState(Math.floor((now.getDate() - 1) / 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    inventoryFetch("/api/sales", { signal: controller.signal }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error();
      setSales(Array.isArray(body?.sales) ? body.sales : []);
    }).catch((reason) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError("Unable to load historical sales.");
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const weeks = monthWeekRanges(month);
  const analysis = useMemo(() => {
    const { year: monthYear, monthIndex } = monthParts(month);
    const selectedWeek = weeks[Math.min(weekIndex, weeks.length - 1)] ?? weeks[0];
    const selectedDay = new Date(`${day}T00:00:00`);
    const start = period === "1D" ? selectedDay : period === "1Y" ? new Date(year, 0, 1) : period === "1M" ? new Date(monthYear, monthIndex, 1) : new Date(monthYear, monthIndex, selectedWeek.startDay);
    const end = period === "1D" ? new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate() + 1) : period === "1Y" ? new Date(year + 1, 0, 1) : period === "1M" ? new Date(monthYear, monthIndex + 1, 1) : new Date(monthYear, monthIndex, selectedWeek.endDay + 1);
    const selected = sales.filter((sale) => { const date = new Date(sale.createdAt); return date >= start && date < end; });
    const bucketDates = period === "1D"
      ? Array.from({ length: 24 }, (_, hour) => new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), hour))
      : period === "1Y"
      ? Array.from({ length: 12 }, (_, index) => new Date(year, index, 1))
      : period === "1M"
        ? weeks.map((week) => new Date(monthYear, monthIndex, week.startDay))
        : Array.from({ length: selectedWeek.endDay - selectedWeek.startDay + 1 }, (_, index) => new Date(monthYear, monthIndex, selectedWeek.startDay + index));
    const buckets = bucketDates.map((date, index) => {
      const next = period === "1D" ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1) : period === "1Y" ? new Date(year, index + 1, 1) : period === "1M" ? new Date(monthYear, monthIndex, (weeks[index]?.endDay ?? date.getDate()) + 1) : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      const value = selected.filter((sale) => { const sold = new Date(sale.createdAt); return sold >= date && sold < next; }).reduce((sum, sale) => sum + Number(sale.total ?? Number(sale.unitPrice) * sale.quantity), 0);
      const label = period === "1D" ? new Intl.DateTimeFormat("en", { hour: "numeric" }).format(date) : period === "1Y" ? new Intl.DateTimeFormat("en", { month: "short" }).format(date) : period === "1M" ? `Week ${index + 1}` : new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric" }).format(date);
      return { label, value };
    });
    const top = buckets.reduce((best, bucket) => bucket.value > best.value ? bucket : best, buckets[0] ?? { label: "No sales", value: 0 });
    return { selected, buckets, top, total: buckets.reduce((sum, bucket) => sum + bucket.value, 0) };
  }, [sales, period, day, year, month, weekIndex, weeks]);

  const visibleSales = useMemo(() => {
    const value = query.trim().toLowerCase();
    return analysis.selected.filter((sale) => !value || [sale.productName, sale.categoryName, sale.size].some((field) => field.toLowerCase().includes(value)));
  }, [query, analysis.selected]);
  const itemsSold = analysis.selected.reduce((total, sale) => total + sale.quantity, 0);
  const { year: selectedMonthYear, monthIndex: selectedMonthIndex } = monthParts(month);
  const selectedWeek = weeks[Math.min(weekIndex, weeks.length - 1)] ?? weeks[0];
  const periodTitle = period === "1D"
    ? `Sales on ${new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${day}T00:00:00`))}`
    : period === "1Y"
    ? `Sales in ${year}`
    : period === "1M"
      ? `Sales in ${new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(selectedMonthYear, selectedMonthIndex, 1))}`
      : `Sales in ${new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(selectedMonthYear, selectedMonthIndex, 1))} ${selectedWeek.startDay}–${selectedWeek.endDay}`;

  return <div className="sales-history-view">
    <div className="stock-summary-grid historical-summary-grid">
      <article className="stock-summary-card stock-value-card" aria-label="Money made in selected period"><span className="stock-summary-title">Money made</span><span className="stock-summary-icon stock-value-icon"><Coins aria-hidden="true" /></span><div className={`stock-value-amount${loading ? " sales-value-loading" : ""}`}>{loading ? "Loading…" : money(analysis.total)}</div><span className="historical-card-note">In the selected {period === "1D" ? "day" : period === "1W" ? "week" : period === "1M" ? "month" : "year"}</span></article>
      <article className="stock-summary-card selling-summary-card best" aria-label="Highest sales period"><span className="stock-summary-title">Highest sales {period === "1D" ? "hour" : period === "1W" ? "day" : period === "1M" ? "week" : "month"}</span><span className="stock-summary-icon selling-summary-icon"><BadgeDollarSign aria-hidden="true" /></span><div className="stock-summary-value-row historical-card-value"><strong className={loading ? "sales-value-loading" : ""}>{loading ? "Loading…" : money(analysis.top.value)}</strong></div><span className="stock-summary-previous">{loading ? "Fetching sales" : analysis.top.label}</span></article>
      <article className="stock-summary-card" aria-label="Items sold"><span className="stock-summary-title">Items sold</span><span className="stock-summary-icon stock-status-icon"><StockStatusIcon /></span><div className="stock-summary-value-row"><strong className={loading ? "sales-value-loading" : ""}>{loading ? "…" : itemsSold}</strong></div><span className="stock-summary-previous">Units sold in this {period === "1D" ? "day" : period === "1W" ? "week" : period === "1M" ? "month" : "year"}</span></article>
      <article className="stock-summary-card" aria-label="Sales recorded"><span className="stock-summary-title">Sales recorded</span><span className="stock-summary-icon historical-count-icon"><ClipboardList aria-hidden="true" /></span><div className="stock-summary-value-row"><strong className={loading ? "sales-value-loading" : ""}>{loading ? "…" : analysis.selected.length}</strong></div><span className="stock-summary-previous">Transactions in this {period === "1D" ? "day" : period === "1W" ? "week" : period === "1M" ? "month" : "year"}</span></article>
    </div>
    {navigation}
    <section className="stock-product-panel sales-product-panel historical-sales-table" aria-labelledby="historical-sales-title">
      <header className="stock-product-toolbar sales-history-toolbar"><h2 id="historical-sales-title">{periodTitle}</h2>
        <div className="sales-history-toolbar-actions"><div className="stock-period-controls">
          {period === "1D" && <label className="stock-period-field"><span>Day</span><input type="date" value={day} onChange={(event) => event.target.value && setDay(event.target.value)} /></label>}
          {period === "1Y" && <label className="stock-period-field"><span>Year</span><input type="number" min="2000" max="2100" value={year} onChange={(event) => setYear(Number(event.target.value) || now.getFullYear())} /></label>}
          {period !== "1D" && period !== "1Y" && <label className="stock-period-field"><span>Month</span><input type="month" value={month} onChange={(event) => { if (event.target.value) { setMonth(event.target.value); setWeekIndex(0); } }} /></label>}
          {period === "1W" && <CustomSelect className="stock-period-field" label="Week" value={String(Math.min(weekIndex, weeks.length - 1))} options={weeks.map((week, index) => ({ label: week.label, value: String(index) }))} onChange={(value) => setWeekIndex(Number(value))} />}
          <div className="stock-period-buttons" aria-label="Sales period">{(["1D", "1W", "1M", "1Y"] as Period[]).map((value) => <button className={period === value ? "active" : ""} type="button" key={value} onClick={() => setPeriod(value)}>{{ "1D": "Day", "1W": "Week", "1M": "Month", "1Y": "Year" }[value]}</button>)}</div>
        </div><label className="stock-product-search"><span className="sr-only">Search sales</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" /><Search aria-hidden="true" /></label></div>
      </header>
      {error && <p className="stock-product-error" role="alert">{error}</p>}
      <div className="stock-product-table-wrap"><table className="stock-product-table sales-product-table"><thead><tr><th>Date</th><th>Name</th><th>Category</th><th>Size</th><th>Sold for</th><th>Quantity</th></tr></thead><tbody className={!loading && !visibleSales.length ? "empty" : ""}>
        {loading && <tr><td className="historical-sales-loading" colSpan={6}><span aria-hidden="true" />Loading historical sales…</td></tr>}
        {visibleSales.map((sale) => <tr key={sale.id}><td>{new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(sale.createdAt))}</td><td><strong>{sale.productName}</strong></td><td><span className="stock-category-pill">{sale.categoryName}</span></td><td>{sale.size || "—"}</td><td>{money(Number(sale.total ?? Number(sale.unitPrice) * sale.quantity))}</td><td><span className="stock-quantity-value">{sale.quantity}</span></td></tr>)}
        {!loading && !visibleSales.length && <tr><td className="stock-product-empty" colSpan={6}><p>{query ? "No sales match your search." : "No sales were recorded in this period."}</p></td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}
