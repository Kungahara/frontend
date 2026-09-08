"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { StockProductTable } from "@/components/stock-product-table";
import { StockSummaryCard } from "@/components/stock-summary-card";

export function StockOverview({ initialView = "products" }: { initialView?: "products" | "analysis" }) {
  const t = useTranslations("Loading");
  const [summaryReady, setSummaryReady] = useState(false);
  const [productsReady, setProductsReady] = useState(false);
  const finishSummary = useCallback(() => setSummaryReady(true), []);
  const finishProducts = useCallback(() => setProductsReady(true), []);
  const ready = summaryReady && productsReady;

  return <>
    <div className={`stock-page-content${ready ? " ready" : ""}`} aria-hidden={!ready}>
      <StockSummaryCard onSettled={finishSummary} />
      <StockProductTable initialAnalysisOpen={initialView === "analysis"} onSettled={finishProducts} />
    </div>
    {!ready && <div className="stock-page-loading" role="status" aria-live="polite"><span aria-hidden="true" /><strong>{t("stock")}</strong><small>{t("stockBody")}</small></div>}
  </>;
}
