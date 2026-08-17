"use client";

import { ArrowLeft, Check, ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { CustomSelect } from "@/components/custom-select";
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
type Sale = { productId: string; quantity: number; unitPrice: string; createdAt: string };
type EditProduct = Product & { quantityText: string; lowStockLevelText: string };
type EditableField = "name" | "categoryId" | "size" | "costPrice" | "sellingPrice" | "quantityText" | "lowStockLevelText";
type NewProduct = { name: string; categoryId: string; categoryName: string; size: string; quantity: string; costPrice: string; sellingPrice: string; lowStockLevel: string };
type AddMode = "existing" | "new";

const emptyProduct: NewProduct = { name: "", categoryId: "", categoryName: "", size: "", quantity: "", costPrice: "", sellingPrice: "", lowStockLevel: "0" };
const newCategoryValue = "__new__";
const newItemValue = "__new_item__";

function lowStockThreshold(quantity: string | number) {
  return Math.ceil(Math.max(0, Number(quantity) || 0) * 0.2);
}

function availableQuantity(product: Product) {
  return Math.max(0, Number(product.quantity) || 0);
}

type AnalysisPeriod = "1W" | "1M" | "1Y";

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

function smoothLinePath(points: Array<[number, number]>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  const widths = points.slice(0, -1).map((point, index) => points[index + 1][0] - point[0]);
  const slopes = widths.map((width, index) => (points[index + 1][1] - points[index][1]) / width);
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    const left = slopes[index - 1], right = slopes[index];
    if (left === 0 || right === 0 || Math.sign(left) !== Math.sign(right)) return 0;
    const leftWeight = 2 * widths[index] + widths[index - 1];
    const rightWeight = widths[index] + 2 * widths[index - 1];
    return (leftWeight + rightWeight) / (leftWeight / left + rightWeight / right);
  });
  return points.slice(0, -1).reduce((path, point, index) => {
    const next = points[index + 1], width = widths[index];
    return `${path} C ${point[0] + width / 3} ${point[1] + tangents[index] * width / 3}, ${next[0] - width / 3} ${next[1] - tangents[index + 1] * width / 3}, ${next[0]} ${next[1]}`;
  }, `M ${points[0][0]} ${points[0][1]}`);
}

function niceAxisMaximum(value: number) {
  if (value <= 0) return 4;
  const roughStep = (value * 1.15) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return niceStep * magnitude * 4;
}

function StockAnalysisChart({ products, sales, categoryId, productId, period, year, month, weekIndex }: { products: Product[]; sales: Sale[]; categoryId: string; productId: string; period: AnalysisPeriod; year: number; month: string; weekIndex: number }) {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; series: "Income" | "Expenses" } | null>(null);
  const categoryProducts = categoryId === "all" ? products : products.filter((product) => product.categoryId === categoryId);
  const selected = productId === "all" ? categoryProducts : categoryProducts.filter((product) => product.id === productId);
  const selectedIds = new Set(selected.map((product) => product.id));
  const costs = new Map(selected.map((product) => [product.id, Number(product.costPrice)]));
  const { year: selectedMonthYear, monthIndex } = monthParts(month);
  const weekRanges = monthWeekRanges(month);
  const selectedWeek = weekRanges[Math.min(weekIndex, weekRanges.length - 1)] ?? weekRanges[0];
  const dates = period === "1Y"
    ? Array.from({ length: 12 }, (_, index) => new Date(year, index, 1))
    : period === "1M"
      ? monthWeekRanges(month).map((range) => new Date(selectedMonthYear, monthIndex, range.startDay))
      : Array.from({ length: selectedWeek.endDay - selectedWeek.startDay + 1 }, (_, index) => new Date(selectedMonthYear, monthIndex, selectedWeek.startDay + index));
  const series = dates.map((date, index) => {
    const end = period === "1Y"
      ? new Date(year, index + 1, 1)
      : period === "1M"
        ? new Date(selectedMonthYear, monthIndex, weekRanges[index].endDay + 1)
        : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const records = sales.filter((sale) => selectedIds.has(sale.productId) && new Date(sale.createdAt) >= date && new Date(sale.createdAt) < end);
    return {
      income: records.reduce((total, sale) => total + sale.quantity * Number(sale.unitPrice), 0),
      expenses: records.reduce((total, sale) => total + sale.quantity * (costs.get(sale.productId) ?? 0), 0),
      hasRecords: records.length > 0,
    };
  });
  const pointCount = dates.length;
  const income = series.map((point) => point.income);
  const expenses = series.map((point) => point.expenses);
  const hasRecordedSales = series.some((point) => point.hasRecords);
  const axisMaximum = niceAxisMaximum(Math.max(...expenses, ...income));
  const x = (index: number) => 58 + (index / (pointCount - 1)) * 468;
  const y = (value: number) => 190 - (value / axisMaximum) * 150;
  const incomePoints = income.map((value, index) => [x(index), y(value)] as [number, number]);
  const expensePoints = expenses.map((value, index) => [x(index), y(value)] as [number, number]);
  const incomePath = smoothLinePath(incomePoints);
  const expensePath = smoothLinePath(expensePoints);
  const formatRwf = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  const formatDate = (date: Date) => period === "1W"
    ? `${new Intl.DateTimeFormat("en", { weekday: "short" }).format(date)} ${date.getDate()}`
    : new Intl.DateTimeFormat("en", period === "1Y" ? { month: "short" } : { month: "short", day: "numeric" }).format(date);
  const hoveredValues = hoveredPoint?.series === "Income" ? income : expenses;
  const tooltipX = hoveredPoint ? Math.min(438, Math.max(64, x(hoveredPoint.index) - 46)) : 0;
  const tooltipY = hoveredPoint ? Math.max(8, y(hoveredValues[hoveredPoint.index]) - 50) : 0;

  return <div className="stock-analysis-chart">
    {selected.length ? hasRecordedSales ? <svg viewBox="0 0 560 225" role="img" aria-label={`Recorded income and expenses for the selected ${period === "1Y" ? "year" : period === "1M" ? "month" : "week"}`} onMouseLeave={() => setHoveredPoint(null)}>
      <defs>
        <linearGradient id="income-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#35b866" stopOpacity="0.2" /><stop offset="1" stopColor="#35b866" stopOpacity="0" /></linearGradient>
        <linearGradient id="expense-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ef6a70" stopOpacity="0.18" /><stop offset="1" stopColor="#ef6a70" stopOpacity="0" /></linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <g key={ratio}><line x1="58" x2="526" y1={190 - ratio * 150} y2={190 - ratio * 150} /><text x="49" y={194 - ratio * 150} textAnchor="end">{formatRwf(axisMaximum * ratio)}</text></g>)}
      <line className="stock-axis" x1="58" x2="58" y1="40" y2="190" />
      <line className="stock-axis" x1="58" x2="526" y1="190" y2="190" />
      {dates.map((date, index) => <text x={x(index)} y="209" textAnchor="middle" key={`label-${index}-${date.toISOString()}`}>{formatDate(date)}</text>)}
      <text className="stock-axis-label" x="14" y="116" textAnchor="middle" transform="rotate(-90 14 116)">RWF</text>
      <path className="stock-chart-area" fill="url(#income-area)" d={`${incomePath} L 526 190 L 58 190 Z`} />
      <path className="stock-chart-area" fill="url(#expense-area)" d={`${expensePath} L 526 190 L 58 190 Z`} />
      <g className="income-series"><path className="stock-chart-line" d={incomePath} />{income.map((value, index) => <g className="stock-chart-point" key={`income-${index}`} onMouseEnter={() => setHoveredPoint({ index, series: "Income" })} onMouseLeave={() => setHoveredPoint(null)}><circle className="stock-chart-point-hit" cx={x(index)} cy={y(value)} r="10" /><circle className="stock-chart-point-ring" cx={x(index)} cy={y(value)} r="5" /><circle className="stock-chart-point-core" cx={x(index)} cy={y(value)} r="2.35" /></g>)}</g>
      <g className="expense-series"><path className="stock-chart-line" d={expensePath} />{expenses.map((value, index) => <g className="stock-chart-point" key={`expenses-${index}`} onMouseEnter={() => setHoveredPoint({ index, series: "Expenses" })} onMouseLeave={() => setHoveredPoint(null)}><circle className="stock-chart-point-hit" cx={x(index)} cy={y(value)} r="10" /><circle className="stock-chart-point-ring" cx={x(index)} cy={y(value)} r="5" /><circle className="stock-chart-point-core" cx={x(index)} cy={y(value)} r="2.35" /></g>)}</g>
      {hoveredPoint && <g className="stock-chart-tooltip" pointerEvents="none"><rect x={tooltipX} y={tooltipY} width="92" height="39" rx="5" /><text x={tooltipX + 8} y={tooltipY + 15}>{formatDate(dates[hoveredPoint.index])}</text><text className="value" x={tooltipX + 8} y={tooltipY + 30}>{hoveredPoint.series}: {formatRwf(hoveredValues[hoveredPoint.index])}</text></g>}
    </svg> : <div className="stock-analysis-empty">No recorded sales for this selection and period.</div> : <div className="stock-analysis-empty">No products in this category yet.</div>}
  </div>;
}

export function StockProductTable({ onSettled }: { onSettled?: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EditProduct | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("existing");
  const [existingProductId, setExistingProductId] = useState("");
  const [existingQuantity, setExistingQuantity] = useState("");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>(emptyProduct);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedAnalysisProductId, setSelectedAnalysisProductId] = useState("all");
  const [analysisPeriod, setAnalysisPeriod] = useState<AnalysisPeriod>("1Y");
  const [analysisYear, setAnalysisYear] = useState(() => new Date().getFullYear());
  const [analysisMonth, setAnalysisMonth] = useState(currentMonthValue);
  const [analysisWeekIndex, setAnalysisWeekIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.all([
      inventoryFetch("/api/products", { signal: controller.signal }),
      inventoryFetch("/api/categories", { signal: controller.signal }),
      inventoryFetch("/api/sales", { signal: controller.signal }),
    ]).then(async ([productResponse, categoryResponse, salesResponse]) => {
      if (!productResponse.ok || !categoryResponse.ok || !salesResponse.ok) throw new Error("Unable to load stock products.");
      const [productBody, categoryBody, salesBody] = await Promise.all([productResponse.json(), categoryResponse.json(), salesResponse.json()]);
      if (!active) return;
      setProducts(Array.isArray(productBody.products) ? productBody.products : []);
      setCategories(Array.isArray(categoryBody.categories) ? categoryBody.categories : []);
      setSales(Array.isArray(salesBody.sales) ? salesBody.sales : []);
    }).catch((reason) => {
      if (!active) return;
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "Unable to load stock products.");
    }).finally(() => {
      if (active) {
        setLoading(false);
        onSettled?.();
      }
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [onSettled]);

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
    const calculatedLowStockLevel = lowStockThreshold(quantity);
    const response = await inventoryFetch(`/api/products/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: editing.categoryId,
        name: editing.name,
        size: editing.size,
        costPrice: editing.costPrice,
        lowStockLevel: calculatedLowStockLevel,
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
      lowStockLevel: calculatedLowStockLevel, quantity,
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
    setError("");
    const name = newProduct.name.trim();
    const size = newProduct.size.trim();
    const quantity = Number(newProduct.quantity);
    const costPrice = Number(newProduct.costPrice);
    const hasCategory = Boolean(newProduct.categoryId && (newProduct.categoryId !== newCategoryValue || newProduct.categoryName.trim()));
    if (!name || !size || !newProduct.quantity.trim() || !newProduct.costPrice.trim() || !hasCategory) {
      setError("Complete every product field before adding it.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 0 || !Number.isFinite(costPrice) || costPrice < 0) {
      setError("Enter a valid whole quantity and purchase price.");
      return;
    }
    setBusy(true);
    const matchingProduct = products.find((product) => product.name.trim().toLocaleLowerCase() === newProduct.name.trim().toLocaleLowerCase() && product.size.trim().toLocaleLowerCase() === newProduct.size.trim().toLocaleLowerCase());
    if (matchingProduct) {
      const addedQuantity = Number(newProduct.quantity);
      const response = await inventoryFetch(`/api/products/${matchingProduct.id}/stock-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: addedQuantity, note: "Added through Add Product" }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error?.message ?? "Unable to add to this product.");
        setBusy(false);
        return;
      }
      setProducts((current) => current.map((product) => product.id === matchingProduct.id ? body.product : product));
      setQuery("");
      setAdding(false);
      setNewProduct(emptyProduct);
      window.dispatchEvent(new Event("kungahara:inventory-changed"));
      setBusy(false);
      return;
    }
    let categoryId = newProduct.categoryId;
    if (!categoryId || categoryId === newCategoryValue) {
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
        sellingPrice: newProduct.costPrice,
        categoryId,
        sku: `SKU-${Date.now()}`,
        quantity: Number(newProduct.quantity),
        lowStockLevel: lowStockThreshold(newProduct.quantity),
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error?.message ?? "Unable to add this product.");
      setBusy(false);
      return;
    }
    setProducts((current) => body.merged ? current.map((product) => product.id === body.product.id ? body.product : product) : [...current, body.product]);
    setQuery("");
    setAnalysisOpen(false);
    setAdding(false);
    setNewProduct(emptyProduct);
    setError("");
    window.dispatchEvent(new Event("kungahara:inventory-changed"));
    setBusy(false);
  }

  function openAddDialog() {
    setError(""); setCategoryPickerOpen(false); setExistingQuantity("");
    setExistingProductId(products[0]?.id ?? ""); setAddMode(products.length ? "existing" : "new");
    setNewProduct({ ...emptyProduct, categoryId: categories[0]?.id ?? newCategoryValue }); setAdding(true);
  }

  async function addExistingStock() {
    const quantity = Number(existingQuantity);
    if (!existingProductId || !Number.isInteger(quantity) || quantity < 1) { setError("Choose an item and enter a quantity of at least 1."); return; }
    setBusy(true); setError("");
    const response = await inventoryFetch(`/api/products/${existingProductId}/stock-in`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, note: "Quantity re-added through Add product" }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) { setError(body?.error?.message ?? "Unable to add this quantity."); setBusy(false); return; }
    setProducts((current) => current.map((product) => product.id === existingProductId ? body.product : product));
    setAdding(false); setExistingQuantity(""); setQuery(""); setBusy(false);
    window.dispatchEvent(new Event("kungahara:inventory-changed"));
    window.dispatchEvent(new Event("kungahara:data-changed"));
  }

  if (analysisOpen) {
    const selectedCategoryName = selectedCategoryId === "all" ? "All categories" : categories.find((category) => category.id === selectedCategoryId)?.name ?? "Category";
    const categoryProducts = selectedCategoryId === "all" ? products : products.filter((product) => product.categoryId === selectedCategoryId);
    const selectedProductName = selectedAnalysisProductId === "all" ? selectedCategoryName : products.find((product) => product.id === selectedAnalysisProductId)?.name ?? selectedCategoryName;
    const weekRanges = monthWeekRanges(analysisMonth);
    return <div className="stock-analysis-replacement" id="stock-analysis">
      <section className="stock-profit-section" aria-labelledby="stock-analysis-title">
        <header><div><h2 id="stock-analysis-title">Income and expenses</h2><p>{selectedProductName} · Recorded sales in RWF</p></div><button type="button" onClick={() => setAnalysisOpen(false)}><ArrowLeft aria-hidden="true" />Back to Stock products</button></header>
        <div className="stock-analysis-meta">
          <div className="stock-analysis-legend"><span className="income">Income</span><span className="expenses">Expenses</span></div>
          <div className="stock-period-controls">
            {analysisPeriod === "1Y" && <label className="stock-period-field"><span>Year</span><input type="number" min="2000" max="2100" value={analysisYear} onChange={(event) => setAnalysisYear(Number(event.target.value) || new Date().getFullYear())} /></label>}
            {analysisPeriod !== "1Y" && <label className="stock-period-field"><span>Month</span><input type="month" value={analysisMonth} onChange={(event) => { if (event.target.value) { setAnalysisMonth(event.target.value); setAnalysisWeekIndex(0); } }} /></label>}
            {analysisPeriod === "1W" && <CustomSelect className="stock-period-field" label="Week" value={String(analysisWeekIndex)} options={weekRanges.map((range, index) => ({ label: range.label, value: String(index) }))} onChange={(value) => setAnalysisWeekIndex(Number(value))} />}
            <div className="stock-period-buttons" aria-label="Graph period">
              {(["1W", "1M", "1Y"] as AnalysisPeriod[]).map((period) => <button className={analysisPeriod === period ? "active" : ""} type="button" aria-pressed={analysisPeriod === period} key={period} onClick={() => setAnalysisPeriod(period)}>{{ "1W": "Week", "1M": "Month", "1Y": "Year" }[period]}</button>)}
            </div>
          </div>
        </div>
        <StockAnalysisChart products={products} sales={sales} categoryId={selectedCategoryId} productId={selectedAnalysisProductId} period={analysisPeriod} year={analysisYear} month={analysisMonth} weekIndex={analysisWeekIndex} />
      </section>
      <aside className="stock-product-section" aria-labelledby="product-analysis-title">
        <header><h2 id="product-analysis-title">Products</h2><p>Choose what to show on the graph.</p></header>
        <div className="stock-product-choice">
          <button className={selectedAnalysisProductId === "all" ? "active" : ""} type="button" onClick={() => setSelectedAnalysisProductId("all")}><span>All in {selectedCategoryName}</span><small>{categoryProducts.length}</small></button>
          {categoryProducts.map((product) => <button className={selectedAnalysisProductId === product.id ? "active" : ""} type="button" key={product.id} onClick={() => setSelectedAnalysisProductId(product.id)}><span>{product.name}</span><small>{availableQuantity(product)} left</small></button>)}
        </div>
      </aside>
      <aside className="stock-category-section" aria-labelledby="category-analysis-title">
        <header><h2 id="category-analysis-title">Categories</h2><p>Choose a category to analyze.</p></header>
        <div className="stock-category-list">
          <button className={selectedCategoryId === "all" ? "active" : ""} type="button" onClick={() => { setSelectedCategoryId("all"); setSelectedAnalysisProductId("all"); }}><span>All categories</span><small>{products.length} {products.length === 1 ? "product" : "products"}</small></button>
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
        <button className="stock-add-product" type="button" onClick={openAddDialog}><Plus aria-hidden="true" />Add product</button>
      </div>
    </header>
    {error && <p className="stock-product-error" role="alert">{error}</p>}
    <div className="stock-product-table-wrap">
      <table className="stock-product-table">
        <thead><tr><th>Name</th><th><button className="stock-category-heading" type="button" aria-expanded={analysisOpen} aria-controls="stock-analysis" onClick={() => void openAnalysis()}>Category</button></th><th>Size</th><th>Price bought for</th><th>Quantity</th><th>Actions</th></tr></thead>
        <tbody className={!loading && !visibleProducts.length ? "empty" : ""}>
          {visibleProducts.map((product) => {
            const quantity = availableQuantity(product);
            const isLowStock = quantity <= product.lowStockLevel;
            return <tr key={product.id}>
              <td><strong>{product.name}</strong></td>
              <td><button className="stock-category-pill" type="button" onClick={() => setQuery(product.categoryName)}>{product.categoryName}</button></td>
              <td>{product.size || "—"}</td>
              <td>{`${new Intl.NumberFormat("en-RW").format(Number(product.costPrice))} RWF`}</td>
              <td><span className={`stock-quantity-value${isLowStock ? " low" : ""}`} tabIndex={isLowStock ? 0 : undefined} aria-label={isLowStock ? `${quantity} units. Stock value is low.` : `${quantity} units`} data-tooltip={isLowStock ? "Stock value is low" : undefined}>{quantity}</span></td>
              <td><div className="stock-row-actions"><button type="button" aria-label={`Edit ${product.name}`} onClick={() => { setError(""); setEditing({ ...product, quantityText: String(product.quantity), lowStockLevelText: String(lowStockThreshold(product.quantity)) }); }}><Pencil aria-hidden="true" /></button><button className="danger" type="button" aria-label={`Delete ${product.name}`} onClick={() => { setDeleting(product); setConfirmation(""); }}><Trash2 aria-hidden="true" /></button></div></td>
            </tr>;
          })}
          {!loading && !visibleProducts.length && <tr><td className="stock-product-empty" colSpan={6}>{query ? <p>No products match your search.</p> : <div className="stock-empty-state"><Image src="/images/stock-empty.png" alt="Business owner ready to organize inventory" width={180} height={180} /><strong>Start adding products now</strong><p>Build your stock list and keep every item organized in one place.</p><button type="button" onClick={openAddDialog}><Plus aria-hidden="true" />Add your first product</button></div>}</td></tr>}
          {loading && <tr><td className="stock-product-empty" colSpan={6}>Loading stock products…</td></tr>}
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
      <form className="stock-delete-dialog stock-add-dialog" role="dialog" aria-modal="true" aria-labelledby="add-product-title" onSubmit={(event) => { event.preventDefault(); void (addMode === "existing" ? addExistingStock() : addProduct()); }}>
        <button className="stock-delete-close" type="button" aria-label="Close" onClick={() => { setCategoryPickerOpen(false); setAdding(false); }}><X aria-hidden="true" /></button>
        <h3 id="add-product-title">Add product</h3>
        <div className="stock-add-grid">
          {products.length > 0 && (addMode === "new" ? <label>Product name<input autoFocus required value={newProduct.name} onChange={(event) => setNewProduct((current) => ({ ...current, name: event.target.value }))} /></label> : <CustomSelect className="stock-add-product-selector" label="Product name" value={existingProductId} options={[...products.map((product) => ({ value: product.id, label: `${product.name} · ${product.size || "No size"} · ${product.quantity} in stock` })), { value: newItemValue, label: "+ New item" }]} onChange={(value) => { setError(""); if (value === newItemValue) { setAddMode("new"); setExistingProductId(""); setNewProduct((current) => ({ ...current, name: "" })); } else { setAddMode("existing"); setExistingProductId(value); } }} />)}
          {addMode === "existing" && products.length > 0 ? <>
            <label>Category<input readOnly value={products.find((product) => product.id === existingProductId)?.categoryName ?? ""} /></label>
            <label>Size<input readOnly value={products.find((product) => product.id === existingProductId)?.size ?? ""} /></label>
            <label>Quantity to add<input required type="number" min="1" step="1" value={existingQuantity} onChange={(event) => setExistingQuantity(event.target.value)} /></label>
            <label>Price bought for<input readOnly value={products.find((product) => product.id === existingProductId)?.costPrice ?? ""} /></label>
            <label>Current stock<input readOnly value={products.find((product) => product.id === existingProductId)?.quantity ?? 0} /></label>
          </> : <>
          {products.length === 0 && <label>Product name<input required value={newProduct.name} onChange={(event) => setNewProduct((current) => ({ ...current, name: event.target.value }))} /></label>}
          <div className="stock-form-field stock-category-picker">
            <span>Category</span>
            <button className="stock-category-picker-trigger" type="button" aria-haspopup="listbox" aria-expanded={categoryPickerOpen} onClick={() => setCategoryPickerOpen((current) => !current)}><span>{newProduct.categoryId === newCategoryValue ? "Create new category" : categories.find((category) => category.id === newProduct.categoryId)?.name ?? "Choose category"}</span><ChevronDown aria-hidden="true" /></button>
            {categoryPickerOpen && <div className="stock-category-picker-menu" role="listbox" aria-label="Product category">
              {categories.map((category) => <button className={newProduct.categoryId === category.id ? "selected" : ""} type="button" role="option" aria-selected={newProduct.categoryId === category.id} key={category.id} onClick={() => { setNewProduct((current) => ({ ...current, categoryId: category.id, categoryName: "" })); setCategoryPickerOpen(false); }}><span>{category.name}</span>{newProduct.categoryId === category.id && <Check aria-hidden="true" />}</button>)}
              <button className={`new-category${newProduct.categoryId === newCategoryValue ? " selected" : ""}`} type="button" role="option" aria-selected={newProduct.categoryId === newCategoryValue} onClick={() => { setNewProduct((current) => ({ ...current, categoryId: newCategoryValue })); setCategoryPickerOpen(false); }}><Plus aria-hidden="true" /><span>Create new category</span></button>
            </div>}
          </div>
          {newProduct.categoryId === newCategoryValue && <label>New category name<input required value={newProduct.categoryName} onChange={(event) => setNewProduct((current) => ({ ...current, categoryName: event.target.value }))} placeholder="e.g. Clothing" /></label>}
          <label>Size<input required value={newProduct.size} onChange={(event) => setNewProduct((current) => ({ ...current, size: event.target.value }))} placeholder="S, M, L…" /></label>
          <label>Quantity<input required type="number" min="0" value={newProduct.quantity} onChange={(event) => { const quantity = event.target.value; setNewProduct((current) => ({ ...current, quantity, lowStockLevel: String(lowStockThreshold(quantity)) })); }} /></label>
          <label>Price bought for<input required type="number" min="0" step="0.01" value={newProduct.costPrice} onChange={(event) => setNewProduct((current) => ({ ...current, costPrice: event.target.value }))} /></label>
          <label>Low-stock alert (20%)<input readOnly type="number" value={newProduct.lowStockLevel} title="Calculated automatically as 20% of the entered quantity" /></label>
          </>}
        </div>
        {error && <p className="stock-add-note" role="alert">{error}</p>}
        <button className="stock-add-submit" disabled={busy}>{busy ? "Adding…" : addMode === "existing" && products.length ? "Add quantity" : "Add product"}</button>
      </form>
    </div>}
    {editing && <div className="stock-delete-backdrop" role="presentation">
      <form className="stock-delete-dialog stock-add-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-product-title" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <button className="stock-delete-close" type="button" aria-label="Close" onClick={() => setEditing(null)}><X aria-hidden="true" /></button>
        <h3 id="edit-product-title">Edit product</h3>
        <div className="stock-add-grid">
          <label className="stock-form-wide">Product name<input required value={editing.name} onChange={(event) => change("name", event.target.value)} /></label>
          <CustomSelect label="Category" value={editing.categoryId} options={categories.map((category) => ({ label: category.name, value: category.id }))} onChange={(value) => change("categoryId", value)} />
          <label>Size<input value={editing.size} onChange={(event) => change("size", event.target.value)} placeholder="S, M, L…" /></label>
          <label>Quantity<input required type="number" min="0" step="1" value={editing.quantityText} onChange={(event) => { const quantity = event.target.value; setEditing((current) => current ? { ...current, quantityText: quantity, lowStockLevelText: String(lowStockThreshold(quantity)) } : current); }} /></label>
          <label>Price bought for<input required type="number" min="0" step="0.01" value={editing.costPrice} onChange={(event) => change("costPrice", event.target.value)} /></label>
          <label>Low-stock alert (20%)<input readOnly type="number" value={editing.lowStockLevelText} title="Calculated automatically as 20% of the entered quantity" /></label>
        </div>
        <button className="stock-add-submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </form>
    </div>}
  </section>;
}
