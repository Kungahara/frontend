"use client";

import { Plus, TrendingDown, TrendingUp, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { CustomSelect } from "@/components/custom-select";
import { apiErrorMessage } from "@/lib/api/client";
import { inventoryFetch } from "@/lib/inventory-client";

type CurrencyPosition = {
  id: string;
  pair: string;
  lastPrice: number | null;
  currentPrice: number | null;
  error?: boolean;
};

export type CurrencyAlert = {
  id: string;
  title: string;
  message: string;
};

const MAX_CURRENCY_CARDS = 3;
const currencyOptions = ["RWF", "USD", "EUR", "GBP", "KES", "UGX", "TZS", "ZAR", "CAD", "CNY", "JPY", "AUD", "CHF"];

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
}

function movementAlert(currency: CurrencyPosition, copy: { title: (pair: string) => string; message: (values: { pair: string; direction: string; percentage: string; change: string; previous: string; current: string }) => string; increased: string; decreased: string }): CurrencyAlert | null {
  if (currency.lastPrice === null || currency.currentPrice === null) return null;
  if (currency.pair.split("/")[1] !== "RWF") return null;
  if (currency.lastPrice === 0) return null;
  const change = currency.currentPrice - currency.lastPrice;
  const percentageChange = (change / currency.lastPrice) * 100;
  if (Math.abs(percentageChange) < 0.15) return null;
  const direction = change > 0 ? copy.increased : copy.decreased;
  return {
    id: `${currency.id}-${currency.currentPrice}`,
    title: copy.title(currency.pair),
    message: copy.message({ pair: currency.pair, direction, percentage: Math.abs(percentageChange).toFixed(2), change: formatPrice(Math.abs(change)), previous: formatPrice(currency.lastPrice), current: formatPrice(currency.currentPrice) }),
  };
}

export function CurrencyMonitor({ onSignificantChange }: { onSignificantChange?: (alert: CurrencyAlert) => void }) {
  const loadingText = useTranslations("Loading");
  const t = useTranslations("Currency");
  const locale = useLocale();
  const [currencies, setCurrencies] = useState<CurrencyPosition[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [quoteCurrency, setQuoteCurrency] = useState("RWF");
  const alertedRates = useRef(new Set<string>());
  const trackedPairs = currencies.map((currency) => `${currency.id}:${currency.pair}`).join("|");

  useEffect(() => {
    alertedRates.current.clear();
  }, [locale]);

  useEffect(() => {
    const controller = new AbortController();
    inventoryFetch("/api/currencies", { signal: controller.signal }).then(async (response) => {
      const body = await response.json().catch(() => null) as { currencies?: Array<{ id: string; pair: string }> } | null;
      if (!response.ok) throw new Error(apiErrorMessage(body, t("loadError")));
      setCurrencies((body?.currencies ?? []).map((currency) => ({
        id: currency.id, pair: currency.pair, lastPrice: null, currentPrice: null,
      })));
      setError("");
    }).catch((loadError) => {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : t("loadError"));
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingCurrencies(false);
    });
    return () => controller.abort();
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    const tracked = trackedPairs.split("|").filter(Boolean).map((item) => {
      const [id, pair] = item.split(":");
      return { id, pair };
    });

    async function refreshRates() {
      const updates = await Promise.all(tracked.map(async (currency) => {
        const [base, quote] = currency.pair.split("/");
        const response = await fetch(`/api/currencies/rate?base=${base}&quote=${quote}`);
        if (!response.ok) return { ...currency, lastPrice: null, currentPrice: null, error: true };
        const rate = await response.json() as { lastPrice: number; currentPrice: number };
        return { ...currency, lastPrice: rate.lastPrice, currentPrice: rate.currentPrice, error: false };
      }));
      if (cancelled) return;
      setCurrencies((current) => current.map((currency) => updates.find((item) => item.id === currency.id) ?? currency));
      updates.forEach((currency) => {
        const alert = movementAlert(currency, {
          title: (pair) => t("alertTitle", { pair }),
          message: (values) => t("alertMessage", values),
          increased: t("increased"),
          decreased: t("decreased"),
        });
        if (alert && !alertedRates.current.has(alert.id)) {
          alertedRates.current.add(alert.id);
          onSignificantChange?.(alert);
        }
      });
    }

    void refreshRates();
    const timer = window.setInterval(refreshRates, 30 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [trackedPairs, onSignificantChange, t]);

  async function addCurrency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currencies.length >= MAX_CURRENCY_CARDS || busy) return;
    const data = new FormData(event.currentTarget);
    const base = String(data.get("base") ?? "").trim().toUpperCase();
    const quote = String(data.get("quote") ?? "").trim().toUpperCase();
    if (!base || !quote || base === quote || currencies.some((currency) => currency.pair === `${base}/${quote}`)) return;

    setBusy(true);
    setError("");
    try {
      const response = await inventoryFetch("/api/currencies", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ base, quote }),
      });
      const body = await response.json().catch(() => null) as { currency?: { id: string; pair: string } } | null;
      if (!response.ok || !body?.currency) {
        setError(apiErrorMessage(body, t("saveError")));
        return;
      }
      setCurrencies((current) => [...current, {
        id: body.currency!.id, pair: body.currency!.pair, lastPrice: null, currentPrice: null,
      }]);
      setAdding(false);
    } catch {
      setError(t("saveError"));
    } finally {
      setBusy(false);
    }
  }

  async function removeCurrency(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await inventoryFetch(`/api/currencies/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(apiErrorMessage(body, t("removeError")));
        return;
      }
      setCurrencies((current) => current.filter((item) => item.id !== id));
    } catch {
      setError(t("removeError"));
    } finally {
      setBusy(false);
    }
  }

  return <section className="currency-monitor" aria-label={t("monitored")}>
    <div className="currency-card-list">
      {currencies.map((currency) => {
        const movement = currency.lastPrice && currency.currentPrice ? ((currency.currentPrice - currency.lastPrice) / currency.lastPrice) * 100 : null;
        const [base, quote] = currency.pair.split("/");
        const increased = movement === null || movement >= 0;
        const TrendIcon = increased ? TrendingUp : TrendingDown;
        return <article className={`currency-card ${increased ? "currency-up" : "currency-down"}`} key={currency.id}>
          <div className="currency-card-identity">
            <span className="currency-symbols" aria-hidden="true"><i>{base.slice(0, 1)}</i><i>{quote.slice(0, 1)}</i></span>
            <div className="currency-card-pair"><span>{base}/</span><small>{quote}</small></div>
          </div>
          <div className="currency-movement">{currency.error ? <strong>{t("unavailable")}</strong> : movement === null ? <strong>{loadingText("currency")}</strong> : <><TrendIcon aria-hidden="true" /><strong>{Math.abs(movement).toFixed(2)}%</strong></>}</div>
          <button className="currency-remove" type="button" disabled={busy} onClick={() => void removeCurrency(currency.id)}><X aria-hidden="true" /><span>{t("remove")}</span></button>
        </article>;
      })}
    </div>
    <button className="add-currency-button" type="button" disabled={loadingCurrencies || busy || currencies.length >= MAX_CURRENCY_CARDS} title={currencies.length >= MAX_CURRENCY_CARDS ? t("limitHelp") : undefined} onClick={() => setAdding(true)}><Plus aria-hidden="true" /><span>{currencies.length >= MAX_CURRENCY_CARDS ? t("limitReached") : t("add")}</span></button>
    {error && <p className="currency-monitor-error" role="alert">{error}</p>}

    {adding && <div className="currency-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdding(false); }}>
      <section className="currency-dialog" role="dialog" aria-modal="true" aria-labelledby="add-currency-title">
        <button className="currency-dialog-close" type="button" aria-label={t("close")} onClick={() => setAdding(false)}><X aria-hidden="true" /></button>
        <h2 id="add-currency-title">{t("dialogTitle")}</h2>
        <p>{t("dialogBody")}</p>
        <form onSubmit={addCurrency}>
          <div className="currency-form-row">
            <CustomSelect label={t("currency")} name="base" value={baseCurrency} options={currencyOptions.map((code) => ({ label: code, value: code }))} onChange={setBaseCurrency} />
            <CustomSelect label={t("comparedWith")} name="quote" value={quoteCurrency} options={currencyOptions.map((code) => ({ label: code, value: code }))} onChange={setQuoteCurrency} />
          </div>
          <button className="currency-dialog-submit" type="submit" disabled={busy}>{t("start")}</button>
        </form>
      </section>
    </div>}
  </section>;
}
