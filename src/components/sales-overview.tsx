"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { AppPageSkeleton } from "@/components/app-page-skeleton";
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

export function SalesOverview({ initialView = "today" }: { initialView?: SalesView }) {
  const loadingText = useTranslations("Loading");
  const [view, setView] = useState<SalesView>(initialView);
  const [summaryReady, setSummaryReady] = useState(false);
  const [todayReady, setTodayReady] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const finishSummary = useCallback(() => setSummaryReady(true), []);
  const finishToday = useCallback(() => setTodayReady(true), []);
  const finishHistory = useCallback(() => setHistoryReady(true), []);
  const finishAnalytics = useCallback(() => setAnalyticsReady(true), []);
  const ready = summaryReady && todayReady && historyReady && analyticsReady;
  const navigation = <nav className="sales-view-tabs" aria-label="Sales views">
    {salesViews.map((item) => <button className={view === item.id ? "active" : ""} type="button" aria-pressed={view === item.id} key={item.id} onClick={() => setView(item.id)}>{item.label}</button>)}
  </nav>;

  return <>
    <div className={`sales-page-content${ready ? " ready" : " loading"}`} aria-hidden={!ready}>
      <div className="sales-cached-summary" hidden={view === "history"}><StockSummaryCard variant="sales" onSettled={finishSummary} /></div>
      {view !== "history" && navigation}
      <div className="sales-view-content">
        <div className="sales-cached-panel" hidden={view !== "today"}><SalesTodayTable onSettled={finishToday} /></div>
        <div className="sales-cached-panel" hidden={view !== "analytics"}><SalesAnalytics onSettled={finishAnalytics} /></div>
        <div className="sales-cached-panel" hidden={view !== "history"}><SalesHistoryTable navigation={navigation} onSettled={finishHistory} /></div>
      </div>
    </div>
    {!ready && <div className="page-structure-loading"><AppPageSkeleton variant={view === "analytics" ? "sales-analytics" : "sales"} label={loadingText("sales")} embedded /></div>}
  </>;
}
