"use client";

import { useCallback, useState } from "react";

import { SalesTodayTable } from "@/components/sales-today-table";
import { StockSummaryCard } from "@/components/stock-summary-card";

type SalesView = "today" | "history" | "analytics";

const salesViews: Array<{ id: SalesView; label: string }> = [
  { id: "today", label: "Today" },
  { id: "history", label: "Historical sales" },
  { id: "analytics", label: "Sales analytics" },
];

export function SalesOverview() {
  const [view, setView] = useState<SalesView>("today");
  const [summaryReady, setSummaryReady] = useState(false);
  const [tableReady, setTableReady] = useState(false);
  const finishSummary = useCallback(() => setSummaryReady(true), []);
  const finishTable = useCallback(() => setTableReady(true), []);
  const ready = summaryReady && tableReady;

  return <>
    <div className={`sales-page-content${ready ? " ready" : ""}`} aria-hidden={!ready}>
      <StockSummaryCard variant="sales" onSettled={finishSummary} />
      <nav className="sales-view-tabs" aria-label="Sales views">
        {salesViews.map((item) => <button className={view === item.id ? "active" : ""} type="button" aria-pressed={view === item.id} key={item.id} onClick={() => setView(item.id)}>{item.label}</button>)}
      </nav>
      <div className="sales-view-content">
        {view === "today" && <SalesTodayTable onSettled={finishTable} />}
        {view !== "today" && <section className="sales-view-placeholder"><strong>{view === "history" ? "Historical sales" : "Sales analytics"}</strong><p>This section will be built next.</p></section>}
      </div>
    </div>
    {!ready && <div className="sales-page-loading" role="status" aria-live="polite"><span aria-hidden="true" /><strong>Loading sales data…</strong><small>Please wait while we prepare your sales workspace.</small></div>}
  </>;
}
