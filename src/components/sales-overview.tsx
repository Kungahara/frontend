"use client";

import { useCallback, useState } from "react";

import { SalesHistoryTable } from "@/components/sales-history-table";
import { SalesAnalytics } from "@/components/sales-analytics";
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
  const navigation = <nav className="sales-view-tabs" aria-label="Sales views">
    {salesViews.map((item) => <button className={view === item.id ? "active" : ""} type="button" aria-pressed={view === item.id} key={item.id} onClick={() => setView(item.id)}>{item.label}</button>)}
  </nav>;

  return <>
    <div className={`sales-page-content${ready ? " ready" : ""}`} aria-hidden={!ready}>
      {view !== "history" && <StockSummaryCard variant="sales" onSettled={finishSummary} />}
      {view !== "history" && navigation}
      {view === "history" ? <SalesHistoryTable navigation={navigation} /> : <div className="sales-view-content">
        {view === "today" && <SalesTodayTable onSettled={finishTable} />}
        {view === "analytics" && <SalesAnalytics />}
      </div>}
    </div>
    {!ready && <div className="sales-page-loading" role="status" aria-live="polite"><span aria-hidden="true" /><strong>Loading sales data…</strong><small>Please wait while we prepare your sales workspace.</small></div>}
  </>;
}
