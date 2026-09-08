"use client";

import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CustomSelect } from "@/components/custom-select";
import { MoneySortButton, type SortDirection } from "@/components/money-sort-button";
import { apiErrorMessage } from "@/lib/api/client";
import { MoneyAmount } from "@/components/money-amount";
import { inventoryFetch } from "@/lib/inventory-client";

type Product = { id: string; categoryName: string; name: string; size: string; quantity: number; sellingPrice: string };
type Sale = { id: string; productId: string; productName: string; categoryName: string; size: string; quantity: number; unitPrice: string; createdAt: string };

function localDateValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function SalesTodayTable({ onSettled }: { onSettled?: () => void }) {
  const commonText = useTranslations("Common");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [query, setQuery] = useState("");
  const [selling, setSelling] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [soldFor, setSoldFor] = useState("");
  const [editing, setEditing] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState<Sale | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editSoldFor, setEditSoldFor] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tableSort, setTableSort] = useState<{ key: "price" | "quantity"; direction: Exclude<SortDirection, null> } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [productsResponse, salesResponse] = await Promise.all([inventoryFetch("/api/products"), inventoryFetch(`/api/sales?from=${localDateValue()}&to=${localDateValue()}`)]);
    const [productsBody, salesBody] = await Promise.all([productsResponse.json().catch(() => null), salesResponse.json().catch(() => null)]);
    if (!productsResponse.ok || !salesResponse.ok) {
      setError("Unable to load today's sales.");
    } else {
      setProducts(Array.isArray(productsBody?.products) ? productsBody.products : []);
      setSales(Array.isArray(salesBody?.sales) ? salesBody.sales : []);
      setError("");
    }
    setLoading(false);
    onSettled?.();
  }, [onSettled]);

  // Initial loading synchronizes this client table with the sales API.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const todaySales = useMemo(() => {
    const value = query.trim().toLowerCase();
    const filtered = sales.filter((sale) => !value || [sale.productName, sale.categoryName, sale.size].some((field) => field.toLowerCase().includes(value)));
    if (!tableSort) return filtered;
    return [...filtered].sort((a, b) => {
      const difference = tableSort.key === "price" ? Number(a.unitPrice) - Number(b.unitPrice) : a.quantity - b.quantity;
      return difference * (tableSort.direction === "asc" ? 1 : -1);
    });
  }, [query, sales, tableSort]);

  function toggleTableSort(key: "price" | "quantity") {
    setTableSort((current) => ({ key, direction: current?.key === key && current.direction === "asc" ? "desc" : "asc" }));
  }

  function openSellDialog() {
    const first = products.find((product) => product.quantity > 0);
    setProductId(first?.id ?? "");
    setSoldFor(first?.sellingPrice ?? "");
    setQuantity("1");
    setError("");
    setSelling(true);
  }

  async function sell() {
    const product = products.find((item) => item.id === productId);
    const soldQuantity = Number(quantity);
    const salePrice = Number(soldFor);
    if (!productId || !product) {
      setError("Choose the product being sold.");
      return;
    }
    if (!quantity.trim() || !Number.isInteger(soldQuantity) || soldQuantity < 1 || soldQuantity > product.quantity) {
      setError("Enter a whole quantity that is available in stock.");
      return;
    }
    if (!soldFor.trim() || !Number.isFinite(salePrice) || salePrice <= 0) {
      setError("Enter the amount the item was sold for.");
      return;
    }
    setBusy(true);
    setError("");
    const response = await inventoryFetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, unitPrice: salePrice, quantity: soldQuantity }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(apiErrorMessage(body, "Unable to record this sale."));
      setBusy(false);
      return;
    }
    if (body?.product) setProducts((current) => current.map((item) => item.id === product.id ? body.product : item));
    if (body?.sale) setSales((current) => body.merged
      ? current.some((sale) => sale.id === body.sale.id)
        ? current.map((sale) => sale.id === body.sale.id ? body.sale : sale)
        : [body.sale, ...current]
      : [body.sale, ...current]);
    setSelling(false);
    setBusy(false);
    window.dispatchEvent(new Event("kungahara:inventory-changed"));
  }

  function openEditDialog(sale: Sale) {
    setEditing(sale);
    setEditQuantity(String(sale.quantity));
    setEditSoldFor(sale.unitPrice);
    setError("");
  }

  async function saveSale() {
    if (!editing) return;
    const product = products.find((item) => item.id === editing.productId);
    const quantityValue = Number(editQuantity);
    const priceValue = Number(editSoldFor);
    const available = (product?.quantity ?? 0) + editing.quantity;
    if (!editQuantity.trim() || !Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > available) {
      setError("Enter a whole quantity that is available in stock.");
      return;
    }
    if (!editSoldFor.trim() || !Number.isFinite(priceValue) || priceValue <= 0) {
      setError("Enter the amount the item was sold for.");
      return;
    }
    setBusy(true);
    setError("");
    const response = await inventoryFetch(`/api/sales/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: quantityValue, unitPrice: priceValue }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(apiErrorMessage(body, "Unable to update this sale."));
      setBusy(false);
      return;
    }
    if (body?.sale) setSales((current) => current.map((sale) => sale.id === editing.id ? body.sale : sale));
    if (body?.product) setProducts((current) => current.map((item) => item.id === editing.productId ? body.product : item));
    setEditing(null);
    setBusy(false);
    window.dispatchEvent(new Event("kungahara:inventory-changed"));
  }

  async function deleteSale() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    const response = await inventoryFetch(`/api/sales/${deleting.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(apiErrorMessage(body, "Unable to delete this sale."));
      setBusy(false);
      return;
    }
    setSales((current) => current.filter((sale) => sale.id !== deleting.id));
    if (body?.product) setProducts((current) => current.map((product) => product.id === deleting.productId ? body.product : product));
    setDeleting(null);
    setBusy(false);
    window.dispatchEvent(new Event("kungahara:inventory-changed"));
  }

  return <section className="stock-product-panel sales-product-panel" aria-labelledby="today-sales-title">
    <header className="stock-product-toolbar">
      <h2 id="today-sales-title">Today sales</h2>
      <div className="stock-product-toolbar-actions">
        <label className="stock-product-search"><span className="sr-only">Search today sales</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" /><Search aria-hidden="true" /></label>
        <button className="stock-add-product" type="button" disabled={!products.some((product) => product.quantity > 0)} onClick={openSellDialog}><Plus aria-hidden="true" />Sell new item</button>
      </div>
    </header>
    {error && !selling && <p className="stock-product-error" role="alert">{error}</p>}
    <div className="stock-product-table-wrap">
      <table className="stock-product-table sales-product-table">
        <thead><tr><th>Name</th><th>Category</th><th>Size</th><th aria-sort={tableSort?.key === "price" ? tableSort.direction === "asc" ? "ascending" : "descending" : "none"}><MoneySortButton label="Sold for" direction={tableSort?.key === "price" ? tableSort.direction : null} onToggle={() => toggleTableSort("price")} /></th><th aria-sort={tableSort?.key === "quantity" ? tableSort.direction === "asc" ? "ascending" : "descending" : "none"}><MoneySortButton label="Quantity" direction={tableSort?.key === "quantity" ? tableSort.direction : null} onToggle={() => toggleTableSort("quantity")} /></th><th>Actions</th></tr></thead>
        <tbody className={!loading && !todaySales.length ? "empty" : ""}>
          {todaySales.map((sale) => <tr key={sale.id}><td><strong>{sale.productName}</strong></td><td><span className="stock-category-pill">{sale.categoryName}</span></td><td>{sale.size || "—"}</td><td><MoneyAmount value={Number(sale.unitPrice)} /></td><td><span className="stock-quantity-value">{sale.quantity}</span></td><td><div className="stock-row-actions"><button type="button" aria-label={`Edit sale of ${sale.productName}`} onClick={() => openEditDialog(sale)}><Pencil aria-hidden="true" /></button><button className="danger" type="button" aria-label={`Delete sale of ${sale.productName}`} onClick={() => { setError(""); setDeleting(sale); }}><Trash2 aria-hidden="true" /></button></div></td></tr>)}
          {!loading && !todaySales.length && <tr><td className="stock-product-empty" colSpan={6}>{query ? <p>No sales match your search.</p> : <div className="stock-empty-state sales-empty-state"><Image src="/images/stock-empty.png" alt="Business owner ready to record sales" width={180} height={180} /><strong>Ready for today&apos;s first sale</strong><p>Use Sell new item to record a sale. It will appear here automatically.</p><button type="button" disabled={!products.some((product) => product.quantity > 0)} onClick={openSellDialog}><Plus aria-hidden="true" />Sell new item</button></div>}</td></tr>}
        </tbody>
      </table>
    </div>
    {selling && <div className="stock-delete-backdrop" role="presentation"><form className="stock-delete-dialog stock-add-dialog" role="dialog" aria-modal="true" aria-labelledby="sell-item-title" onSubmit={(event) => { event.preventDefault(); void sell(); }}>
      <button className="stock-delete-close" type="button" aria-label="Close" onClick={() => setSelling(false)}><X aria-hidden="true" /></button>
      <h3 id="sell-item-title">Sell new item</h3><p>Choose an item from stock, enter the selling price, and confirm the quantity sold.</p>
      <div className="stock-add-grid">
        <CustomSelect className="stock-form-wide" label="Product" value={productId} options={products.filter((product) => product.quantity > 0).map((product) => ({ value: product.id, label: `${product.name} · ${product.size || "No size"} · ${product.quantity} available` }))} onChange={(value) => { setProductId(value); setSoldFor(products.find((product) => product.id === value)?.sellingPrice ?? ""); }} />
        <label>Quantity sold<input required type="number" min="1" max={products.find((product) => product.id === productId)?.quantity ?? 1} value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
        <label>Sold for<input required type="number" min="0.01" step="0.01" value={soldFor} onChange={(event) => setSoldFor(event.target.value)} /></label>
      </div>
      {error && <p className="stock-add-note" role="alert">{error}</p>}
      <button className="stock-add-submit" disabled={busy}>{busy ? "Recording sale…" : "Sell item"}</button>
    </form></div>}
    {editing && <div className="stock-delete-backdrop" role="presentation"><form className="stock-delete-dialog stock-add-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-sale-title" onSubmit={(event) => { event.preventDefault(); void saveSale(); }}>
      <button className="stock-delete-close" type="button" aria-label="Close" onClick={() => setEditing(null)}><X aria-hidden="true" /></button>
      <h3 id="edit-sale-title">Edit sale</h3><p>Update the recorded quantity or selling price. Stock will be corrected automatically.</p>
      <div className="stock-add-grid">
        <label className="stock-form-wide">Product<input readOnly value={`${editing.productName} · ${editing.size}`} /></label>
        <label>Quantity sold<input required type="number" min="1" max={(products.find((product) => product.id === editing.productId)?.quantity ?? 0) + editing.quantity} value={editQuantity} onChange={(event) => setEditQuantity(event.target.value)} /></label>
        <label>Sold for<input required type="number" min="0.01" step="0.01" value={editSoldFor} onChange={(event) => setEditSoldFor(event.target.value)} /></label>
      </div>
      {error && <p className="stock-add-note" role="alert">{error}</p>}
      <button className="stock-add-submit" disabled={busy}>{busy ? commonText("savingSale") : "Save changes"}</button>
    </form></div>}
    {deleting && <div className="stock-delete-backdrop" role="presentation"><div className="stock-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-sale-title">
      <button className="stock-delete-close" type="button" aria-label="Close" onClick={() => setDeleting(null)}><X aria-hidden="true" /></button>
      <h3 id="delete-sale-title">Delete sale of {deleting.productName}?</h3>
      <p>This removes the sale and restores <strong>{deleting.quantity}</strong> item{deleting.quantity === 1 ? "" : "s"} to Stock.</p>
      {error && <p className="stock-add-note" role="alert">{error}</p>}
      <button className="stock-delete-confirm" type="button" disabled={busy} onClick={() => void deleteSale()}>{busy ? commonText("deletingSale") : "Delete sale"}</button>
    </div></div>}
  </section>;
}
