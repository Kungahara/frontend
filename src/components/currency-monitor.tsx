"use client";

import { Plus, TrendingDown, TrendingUp, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { CustomSelect } from "@/components/custom-select";

type CurrencyPosition = {
  id: number;
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

const initialCurrencies: CurrencyPosition[] = [
  { id: 1, pair: "USD/RWF", lastPrice: null, currentPrice: null },
];

const MAX_CURRENCY_CARDS = 3;
const currencyOptions = ["RWF", "USD", "EUR", "GBP", "KES", "UGX", "TZS", "ZAR", "CAD", "CNY", "JPY", "AUD", "CHF"];

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
}

function movementAlert(currency: CurrencyPosition): CurrencyAlert | null {
  if (currency.lastPrice === null || currency.currentPrice === null) return null;
  if (currency.pair.split("/")[1] !== "RWF") return null;
  const change = currency.currentPrice - currency.lastPrice;
  if (Math.abs(change) < 15) return null;
  const direction = change > 0 ? "increased" : "decreased";
  return {
    id: `${currency.id}-${currency.currentPrice}`,
    title: `${currency.pair} moved significantly`,
    message: `${currency.pair} ${direction} by ${formatPrice(Math.abs(change))} RWF, from ${formatPrice(currency.lastPrice)} to ${formatPrice(currency.currentPrice)}.`,
  };
}

export function CurrencyMonitor({ onSignificantChange }: { onSignificantChange?: (alert: CurrencyAlert) => void }) {
  const [currencies, setCurrencies] = useState(initialCurrencies);
  const [adding, setAdding] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [quoteCurrency, setQuoteCurrency] = useState("RWF");
  const alertedRates = useRef(new Set<string>());
  const trackedPairs = currencies.map((currency) => `${currency.id}:${currency.pair}`).join("|");

  useEffect(() => {
    let cancelled = false;
    const tracked = trackedPairs.split("|").filter(Boolean).map((item) => {
      const [id, pair] = item.split(":");
      return { id: Number(id), pair };
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
        const alert = movementAlert(currency);
        if (alert && !alertedRates.current.has(alert.id)) {
          alertedRates.current.add(alert.id);
          onSignificantChange?.(alert);
        }
      });
    }

    void refreshRates();
    const timer = window.setInterval(refreshRates, 30 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [trackedPairs, onSignificantChange]);

  function addCurrency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currencies.length >= MAX_CURRENCY_CARDS) return;
    const data = new FormData(event.currentTarget);
    const base = String(data.get("base") ?? "").trim().toUpperCase();
    const quote = String(data.get("quote") ?? "").trim().toUpperCase();
    if (!base || !quote || base === quote || currencies.some((currency) => currency.pair === `${base}/${quote}`)) return;

    const currency = {
      id: Date.now(),
      pair: `${base}/${quote}`,
      lastPrice: null,
      currentPrice: null,
    };
    setCurrencies((current) => [...current, currency]);
    event.currentTarget.reset();
    setAdding(false);
  }

  return <section className="currency-monitor" aria-label="Monitored currencies">
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
          <div className="currency-movement">{currency.error ? <strong>Unavailable</strong> : movement === null ? <strong>Loading</strong> : <><TrendIcon aria-hidden="true" /><strong>{Math.abs(movement).toFixed(2)}%</strong></>}</div>
          <button className="currency-remove" type="button" onClick={() => setCurrencies((current) => current.filter((item) => item.id !== currency.id))}><X aria-hidden="true" /><span>Remove</span></button>
        </article>;
      })}
    </div>
    <button className="add-currency-button" type="button" disabled={currencies.length >= MAX_CURRENCY_CARDS} title={currencies.length >= MAX_CURRENCY_CARDS ? "You can monitor up to three currency pairs." : undefined} onClick={() => setAdding(true)}><Plus aria-hidden="true" /><span>{currencies.length >= MAX_CURRENCY_CARDS ? "Limit reached" : "Add currency"}</span></button>

    {adding && <div className="currency-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdding(false); }}>
      <section className="currency-dialog" role="dialog" aria-modal="true" aria-labelledby="add-currency-title">
        <button className="currency-dialog-close" type="button" aria-label="Close" onClick={() => setAdding(false)}><X aria-hidden="true" /></button>
        <h2 id="add-currency-title">Add a currency</h2>
        <p>Choose two currencies. Kungahara will fetch and monitor their exchange rate automatically.</p>
        <form onSubmit={addCurrency}>
          <div className="currency-form-row">
            <CustomSelect label="Currency" name="base" value={baseCurrency} options={currencyOptions.map((code) => ({ label: code, value: code }))} onChange={setBaseCurrency} />
            <CustomSelect label="Compared with" name="quote" value={quoteCurrency} options={currencyOptions.map((code) => ({ label: code, value: code }))} onChange={setQuoteCurrency} />
          </div>
          <button className="currency-dialog-submit" type="submit">Start monitoring</button>
        </form>
      </section>
    </div>}
  </section>;
}
