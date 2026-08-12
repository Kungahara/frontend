"use client";

import { ArrowLeft, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { inventoryFetch } from "@/lib/inventory-client";

type Product = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  size: string;
  quantity: number;
  costPrice: string;
  sellingPrice: string;
  lowStockLevel: number;
};

type Category = { id: string; name: string };
type EditProduct = Product & { quantityText: string; lowStockLevelText: string };
type EditableField = "name" | "categoryId" | "size" | "costPrice" | "sellingPrice" | "quantityText" | "lowStockLevelText";
type NewProduct = { name: string; categoryId: string; categoryName: string; size: string; quantity: string; costPrice: string; sellingPrice: string; lowStockLevel: string };

const emptyProduct: NewProduct = { name: "", categoryId: "", categoryName: "", size: "", quantity: "", costPrice: "", sellingPrice: "", lowStockLevel: "15" };

function stockPercentage(product: Product) {
  if (product.quantity <= 0) return 0;
  if (product.lowStockLevel <= 0) return 100;
  return Math.min(100, Math.round((product.quantity / product.lowStockLevel) * 100));
}

function StockAnalysisChart({ products, categoryId, productId }: { products: Product[]; categoryId: string; productId: string }) {
  const categoryProducts = categoryId === "all" ? products : products.filter((product) => product.categoryId === categoryId);
  const selected = productId === "all" ? categoryProducts : categoryProducts.filter((product) => product.id === productId);
  const annualExpenses = selected.reduce((total, product) => total + product.quantity * Number(product.costPrice), 0);
  const annualProfit = selected.reduce((total, product) => total + product.quantity * Math.max(0, Number(product.sellingPrice) - Number(product.costPrice)), 0);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const expenses = months.map((_, index) => annualExpenses * ((index + 1) / 12));
  const profit = months.map((_, index) => annualProfit * ((index + 1) / 12));
  const maxValue = Math.max(1, ...expenses, ...profit);
  const x = (index: number) => 58 + (index / 11) * 468;
  const y = (value: number) => 196 - (value / maxValue) * 154;
  const formatRwf = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

  return <div className="stock-analysis-chart">
    {selected.length ? <svg viewBox="0 0 560 225" role="img" aria-label="Projected cumulative profit and expenses over the year">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <g key={ratio}><line x1="58" x2="526" y1={196 - ratio * 154} y2={196 - ratio * 154} /><text x="49" y={200 - ratio * 154} textAnchor="end">{formatRwf(maxValue * ratio)}</text></g>)}
      <line className="stock-axis" x1="58" x2="526" y1="196" y2="196" />
      {months.map((month, index) => <text x={x(index)} y="211" textAnchor="middle" key={month}>{month}</text>)}
      <text className="stock-axis-label" x="14" y="119" textAnchor="middle" transform="rotate(-90 14 119)">RWF</text>
      <g className="profit-series"><polyline points={profit.map((value, index) => `${x(index)},${y(value)}`).join(" ")} />{profit.map((value, index) => <circle cx={x(index)} cy={y(value)} r="3" key={months[index]}><title>{`Profit ${months[index]}: ${formatRwf(value)} RWF`}</title></circle>)}</g>
      <g className="expense-series"><polyline points={expenses.map((value, index) => `${x(index)},${y(value)}`).join(" ")} />{expenses.map((value, index) => <circle cx={x(index)} cy={y(value)} r="3" key={months[index]}><title>{`Expenses ${months[index]}: ${formatRwf(value)} RWF`}</title></circle>)}</g>
    </svg> : <div className="stock-analysis-empty">No products in this category yet.</div>}
  </div>;
}

export function StockProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EditProduct | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>(emptyProduct);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedAnalysisProductId, setSelectedAnalysisProductId] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      inventoryFetch("/api/products", { signal: controller.signal }),
      inventoryFetch("/api/categories", { signal: controller.signal }),
    ]).then(async ([productResponse, categoryResponse]) => {
      if (!productResponse.ok || !categoryResponse.ok) throw new Error("Unable to load stock products.");
      const [productBody, categoryBody] = await Promise.all([productResponse.json(), categoryResponse.json()]);
      setProducts(Array.isArray(productBody.products) ? productBody.products : []);
      setCategories(Array.isArray(categoryBody.categories) ? categoryBody.categories : []);
    }).catch((reason) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "Unable to load stock products.");
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const visibleProducts = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return products;
    return products.filter((product) => [product.name, product.categoryName, product.size]
      .some((field) => field.toLowerCase().includes(value)));
  }, [products, query]);

  function change(field: EditableField, value: string) {
    setEditing((current) => current ? { ...current, [field]: value } : current);
  }

  function openAnalysis() {
    setQuery("");
    setAnalysisOpen(true);
    setSelectedAnalysisProductId("all");
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError("");
    const original = products.find((product) => product.id === editing.id);
    const quantity = Number(editing.quantityText);
    const response = await inventoryFetch(`/api/products/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: editing.categoryId,
        name: editing.name,
        size: editing.size,
        costPrice: editing.costPrice,
        sellingPrice: editing.sellingPrice,
        lowStockLevel: Number(editing.lowStockLevelText),
        quantityAdjustment: quantity - (original?.quantity ?? quantity),
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error?.message ?? "Unable to save this product.");
      setBusy(false);
      return;
    }
    const category = categories.find((item) => item.id === editing.categoryId);
    setProducts((current) => current.map((product) => product.id === editing.id ? {
      ...product, name: editing.name, categoryId: editing.categoryId,
      categoryName: category?.name ?? product.categoryName, size: editing.size,
      costPrice: editing.costPrice, sellingPrice: editing.sellingPrice,
      lowStockLevel: Number(editing.lowStockLevelText), quantity,
    } : product));
    setQuery("");
    setEditing(null);
    window.dispatchEvent(new Event("kungahara:inventory-changed"));
    setBusy(false);
  }

  async function remove() {
    if (!deleting || confirmation !== deleting.name) return;
    setBusy(true);
    setError("");
    const response = await inventoryFetch(`/api/products/${deleting.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? "Unable to delete this product.");
      setBusy(false);
      return;
    }
    setProducts((current) => current.filter((product) => product.id !== deleting.id));
    window.dispatchEvent(new Event("kungahara:inventory-changed"));
    setDeleting(null);
    setConfirmation("");
    setBusy(false);
  }

  async function addProduct() {
    setBusy(true);
    setError("");
    let categoryId = newProduct.categoryId;
    if (!categoryId) {
      const categoryResponse = await inventoryFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProduct.categoryName }),
      });
      const categoryBody = await categoryResponse.json().catch(() => null);
      if (!categoryResponse.ok) {
        setError(categoryBody?.error?.message ?? "Unable to create this category.");
        setBusy(false);
        return;
      }
      categoryId = categoryBody.category.id;
      setCategories((current) => [...current, categoryBody.category]);
    }
    const response = await inventoryFetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newProduct,
        categoryId,
        sku: `SKU-${Date.now()}`,
        quantity: Number(newProduct.quantity),
        lowStockLevel: Number(newProduct.lowStockLevel),
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error?.message ?? "Unable to add this product.");
      setBusy(false);
      return;
    }
    setProducts((current) => [...current, body.product]);
    setQuery("");
    setAnalysisOpen(false);
    setAdding(false);
    setNewProduct(emptyProduct);
    setError("");
    window.dispatchEvent(new Event("kungahara:inventory-changed"));
    setBusy(false);
  }

  if (analysisOpen) {
    const selectedCategoryName = selectedCategoryId === "all" ? "All categories" : categories.find((category) => category.id === selectedCategoryId)?.name ?? "Category";
    const categoryProducts = selectedCategoryId === "all" ? products : products.filter((product) => product.categoryId === selectedCategoryId);
    const selectedProductName = selectedAnalysisProductId === "all" ? selectedCategoryName : products.find((product) => product.id === selectedAnalysisProductId)?.name ?? selectedCategoryName;
    return <div className="stock-analysis-replacement" id="stock-analysis">
      <section className="stock-profit-section" aria-labelledby="stock-analysis-title">
        <header><div><h2 id="stock-analysis-title">Projected profit and expenses</h2><p>{selectedProductName} · Annual projection in RWF</p></div><button type="button" onClick={() => setAnalysisOpen(false)}><ArrowLeft aria-hidden="true" />Back to Stock products</button></header>
        <div className="stock-analysis-legend"><span className="profit">Profit</span><span className="expenses">Expenses</span></div>
        <StockAnalysisChart products={products} categoryId={selectedCategoryId} productId={selectedAnalysisProductId} />
      </section>
      <aside className="stock-product-section" aria-labelledby="product-analysis-title">
        <header><h2 id="product-analysis-title">Products</h2><p>Choose what to show on the graph.</p></header>
        <div className="stock-product-choice">
          <button className={selectedAnalysisProductId === "all" ? "active" : ""} type="button" onClick={() => setSelectedAnalysisProductId("all")}><span>All in {selectedCategoryName}</span><small>{categoryProducts.length}</small></button>
          {categoryProducts.map((product) => <button className={selectedAnalysisProductId === product.id ? "active" : ""} type="button" key={product.id} onClick={() => setSelectedAnalysisProductId(product.id)}><span>{product.name}</span><small>{product.quantity} left</small></button>)}
        </div>
      </aside>
      <aside className="stock-category-section" aria-labelledby="category-analysis-title">
        <header><h2 id="category-analysis-title">Categories</h2><p>Choose a category to analyze.</p></header>
        <div className="stock-category-list">
          <button className={selectedCategoryId === "all" ? "active" : ""} type="button" onClick={() => { setSelectedCategoryId("all"); setSelectedAnalysisProductId("all"); }}><span>All categories</span><small>{products.length} products</small></button>
          {categories.map((category) => {
            const count = products.filter((product) => product.categoryId === category.id).length;
            return <button className={selectedCategoryId === category.id ? "active" : ""} type="button" key={category.id} onClick={() => { setSelectedCategoryId(category.id); setSelectedAnalysisProductId("all"); }}><span>{category.name}</span><small>{count} {count === 1 ? "product" : "products"}</small></button>;
          })}
        </div>
      </aside>
    </div>;
  }

  return <section className="stock-product-panel" aria-labelledby="stock-products-title">
    <header className="stock-product-toolbar">
      <h2 id="stock-products-title">Stock products</h2>
      <div className="stock-product-toolbar-actions">
        <label className="stock-product-search"><span className="sr-only">Search stock products</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" /><Search aria-hidden="true" /></label>
        <button className="stock-add-product" type="button" onClick={() => { setError(""); setNewProduct({ ...emptyProduct, categoryId: categories[0]?.id ?? "" }); setAdding(true); }}><Plus aria-hidden="true" />Add product</button>
      </div>
    </header>
    {error && <p className="stock-product-error" role="alert">{error}</p>}
    <div className="stock-product-table-wrap">
      <table className="stock-product-table">
        <thead><tr><th>Name</th><th><button className="stock-category-heading" type="button" aria-expanded={analysisOpen} aria-controls="stock-analysis" onClick={() => void openAnalysis()}>Category</button></th><th>Size</th><th>Price bought for</th><th>Sold for</th><th>Stock status</th><th>Actions</th></tr></thead>
        <tbody className={!loading && !visibleProducts.length ? "empty" : ""}>
          {visibleProducts.map((product) => {
            const percentage = stockPercentage(product);
            return <tr key={product.id}>
              <td><strong>{product.name}</strong></td>
              <td><button className="stock-category-pill" type="button" onClick={() => setQuery(product.categoryName)}>{product.categoryName}</button></td>
              <td>{product.size || "—"}</td>
              <td>{`${new Intl.NumberFormat("en-RW").format(Number(product.costPrice))} RWF`}</td>
              <td>{`${new Intl.NumberFormat("en-RW").format(Number(product.sellingPrice))} RWF`}</td>
              <td><span className={`stock-status-pill${percentage <= 25 ? " danger" : percentage <= 60 ? " warning" : ""}`}>{percentage}%</span></td>
              <td><div className="stock-row-actions"><button type="button" aria-label={`Edit ${product.name}`} onClick={() => { setError(""); setEditing({ ...product, quantityText: String(product.quantity), lowStockLevelText: String(product.lowStockLevel || 15) }); }}><Pencil aria-hidden="true" /></button><button className="danger" type="button" aria-label={`Delete ${product.name}`} onClick={() => { setDeleting(product); setConfirmation(""); }}><Trash2 aria-hidden="true" /></button></div></td>
            </tr>;
          })}
          {!loading && !visibleProducts.length && <tr><td className="stock-product-empty" colSpan={7}>{query ? <p>No products match your search.</p> : <div className="stock-empty-state"><Image src="/images/stock-empty.png" alt="Business owner ready to organize inventory" width={180} height={180} /><strong>Start adding products now</strong><p>Build your stock list and keep every item organized in one place.</p><button type="button" onClick={() => { setError(""); setNewProduct({ ...emptyProduct, categoryId: categories[0]?.id ?? "" }); setAdding(true); }}><Plus aria-hidden="true" />Add your first product</button></div>}</td></tr>}
          {loading && <tr><td className="stock-product-empty" colSpan={7}>Loading stock products…</td></tr>}
        </tbody>
      </table>
    </div>
    {deleting && <div className="stock-delete-backdrop" role="presentation">
      <div className="stock-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
        <button className="stock-delete-close" type="button" aria-label="Close" onClick={() => setDeleting(null)}><X aria-hidden="true" /></button>
        <h3 id="delete-product-title">Delete {deleting.name}?</h3>
        <p>This permanently removes the product and its stock history. Type <strong>{deleting.name}</strong> to confirm.</p>
        <label>Product name<input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
        <button className="stock-delete-confirm" type="button" disabled={busy || confirmation !== deleting.name} onClick={remove}>{busy ? "Deleting…" : "Delete product"}</button>
      </div>
    </div>}
    {adding && <div className="stock-delete-backdrop" role="presentation">
      <form className="stock-delete-dialog stock-add-dialog" role="dialog" aria-modal="true" aria-labelledby="add-product-title" onSubmit={(event) => { event.preventDefault(); void addProduct(); }}>
        <button className="stock-delete-close" type="button" aria-label="Close" onClick={() => setAdding(false)}><X aria-hidden="true" /></button>
        <h3 id="add-product-title">Add product</h3>
        <div className="stock-add-grid">
          <label className="stock-form-wide">Product name<input required value={newProduct.name} onChange={(event) => setNewProduct((current) => ({ ...current, name: event.target.value }))} /></label>
          {categories.length ? <label>Category<select required value={newProduct.categoryId} onChange={(event) => setNewProduct((current) => ({ ...current, categoryId: event.target.value }))}><option value="" disabled>Select category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label> : <label>Category<input required value={newProduct.categoryName} onChange={(event) => setNewProduct((current) => ({ ...current, categoryName: event.target.value }))} placeholder="e.g. Clothing" /></label>}
          <label>Size<input value={newProduct.size} onChange={(event) => setNewProduct((current) => ({ ...current, size: event.target.value }))} placeholder="S, M, L…" /></label>
          <label>Quantity<input required type="number" min="0" value={newProduct.quantity} onChange={(event) => setNewProduct((current) => ({ ...current, quantity: event.target.value }))} /></label>
          <label>Price bought for<input required type="number" min="0" step="0.01" value={newProduct.costPrice} onChange={(event) => setNewProduct((current) => ({ ...current, costPrice: event.target.value }))} /></label>
          <label>Low-stock level<input required type="number" min="0" step="1" value={newProduct.lowStockLevel} onChange={(event) => setNewProduct((current) => ({ ...current, lowStockLevel: event.target.value }))} /></label>
          <label>Sold for<input required type="number" min="0" step="0.01" value={newProduct.sellingPrice} onChange={(event) => setNewProduct((current) => ({ ...current, sellingPrice: event.target.value }))} /></label>
        </div>
        <button className="stock-add-submit" disabled={busy}>{busy ? "Adding…" : "Add product"}</button>
      </form>
    </div>}
    {editing && <div className="stock-delete-backdrop" role="presentation">
      <form className="stock-delete-dialog stock-add-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-product-title" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <button className="stock-delete-close" type="button" aria-label="Close" onClick={() => setEditing(null)}><X aria-hidden="true" /></button>
        <h3 id="edit-product-title">Edit product</h3>
        <div className="stock-add-grid">
          <label className="stock-form-wide">Product name<input required value={editing.name} onChange={(event) => change("name", event.target.value)} /></label>
          <label>Category<select required value={editing.categoryId} onChange={(event) => change("categoryId", event.target.value)}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          <label>Size<input value={editing.size} onChange={(event) => change("size", event.target.value)} placeholder="S, M, L…" /></label>
          <label>Quantity<input required type="number" min="0" step="1" value={editing.quantityText} onChange={(event) => change("quantityText", event.target.value)} /></label>
          <label>Price bought for<input required type="number" min="0" step="0.01" value={editing.costPrice} onChange={(event) => change("costPrice", event.target.value)} /></label>
          <label>Low-stock level<input required type="number" min="0" step="1" value={editing.lowStockLevelText} onChange={(event) => change("lowStockLevelText", event.target.value)} /></label>
          <label>Sold for<input required type="number" min="0" step="0.01" value={editing.sellingPrice} onChange={(event) => change("sellingPrice", event.target.value)} /></label>
        </div>
        <button className="stock-add-submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </form>
    </div>}
  </section>;
}
