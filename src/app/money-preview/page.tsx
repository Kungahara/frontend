"use client";

import { useState } from "react";
import { MoneyAmount } from "@/components/money-amount";

export default function MoneyPreview() {
  const [width, setWidth] = useState(220);
  const [amount, setAmount] = useState(5383000);
  return <main style={{ padding: 24 }}>
    <h1>Money layout check</h1>
    <label>Card width<input aria-label="Card width" type="number" value={width} onChange={event => setWidth(Number(event.target.value))} /></label>
    <label>Amount<input aria-label="Amount" type="number" value={amount} onChange={event => setAmount(Number(event.target.value))} /></label>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
      <article className="stock-summary-card stock-value-card" style={{ width }}><span className="stock-summary-title">Stock value</span><div className="stock-value-amount"><MoneyAmount value={amount} /></div><span className="historical-card-note">Full amount on one line</span></article>
      <article className="stock-summary-card" style={{ width }}><span className="stock-summary-title">Income</span><div className="stock-summary-value-row"><strong><MoneyAmount value={amount} /></strong></div><span className="stock-summary-previous">Full amount on one line</span></article>
      <article className="stock-summary-card" style={{ width }}><span className="stock-summary-title">Most selling item</span><div className="stock-summary-value-row sales-item-value-row"><strong className="sales-item-value"><MoneyAmount value={amount} /></strong><span className="selling-item-name">Product</span></div><span className="stock-summary-previous">With a product label</span></article>
    </div>
    <div style={{ width, marginTop: 20, fontSize: 14 }}><MoneyAmount value={-1234567890123.45} /></div>
    <button className="stock-add-product" style={{ marginTop: 20 }}>Add product</button>
  </main>;
}
