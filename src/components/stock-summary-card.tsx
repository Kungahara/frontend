"use client";

import { ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

type Product = { id: string; name: string; quantity: number };
type StockMovement = { productId: string; quantity: number; createdAt: string };

function StockStatusIcon() {
  return <svg viewBox="0 0 27.948 27.948" fill="currentColor" aria-hidden="true">
    <path d="M9.689 19.484h15.503v1.936H8.133L4.99 7.153H.69V5.218h5.854l3.145 14.266Zm1.761 3.224a2.62 2.62 0 1 0 0 5.24 2.62 2.62 0 0 0 0-5.24Zm10.8 0a2.62 2.62 0 1 0 0 5.24 2.62 2.62 0 0 0 0-5.24Zm-11.582-4.673L8.37 6.133h3.76L20.463 0l3.729 5.064-.161 1.069h3.227l-2.687 11.902H10.668Zm12.916-12.558-.892.656h.794l.098-.656Zm-10.546.655h1.958l-.117-.16.379-.279.324.439h.48l-.492-.669.38-.279.697.948h.544l-.89-1.207.381-.279 1.095 1.486h.626l-1.301-1.768.379-.28 1.507 2.048h.544l-1.697-2.308.379-.278 1.902 2.586h1.668l1.639-1.205-3.07-4.176-7.315 5.381Zm8.712-.827-2.088-2.839-.382.279 2.089 2.839.381-.279Zm-.73.54-2.09-2.84-.379.279 2.092 2.839.377-.278Z" />
  </svg>;
}

function SellingCard({ title, itemName, percentage, remainingStock, tone }: { title: string; itemName: string; percentage: number; remainingStock: number; tone: "best" | "least" }) {
  return <article className={`stock-summary-card selling-summary-card ${tone}`} aria-label={title}>
    <span className="stock-summary-title">{title}</span>
    <span className="stock-summary-icon selling-summary-icon"><ShoppingBag aria-hidden="true" /></span>
    <div className="stock-summary-value-row">
      <strong>{new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(percentage)}%</strong>
      <span className="selling-item-name">{itemName}</span>
    </div>
    <span className="stock-summary-previous">Remaining Stock: <strong>{new Intl.NumberFormat("en").format(remainingStock)}</strong></span>
  </article>;
}

export function StockSummaryCard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/products", { signal: controller.signal }),
      fetch("/api/stock-movements", { signal: controller.signal }),
    ]).then(async ([productsResponse, movementsResponse]) => {
      if (!productsResponse.ok || !movementsResponse.ok) throw new Error("Unable to load stock");
      const [productsBody, movementsBody] = await Promise.all([productsResponse.json(), movementsResponse.json()]);
      setProducts(Array.isArray(productsBody.products) ? productsBody.products : []);
      setMovements(Array.isArray(movementsBody.stockMovements) ? movementsBody.stockMovements : []);
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(true);
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const totalUnits = products.reduce((total, product) => total + product.quantity, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const movementThisMonth = movements.reduce((total, movement) => new Date(movement.createdAt) >= startOfMonth ? total + movement.quantity : total, 0);
  const lastMonthUnits = Math.max(0, totalUnits - movementThisMonth);
  const hasStockData = products.length > 0;
  const change = hasStockData ? lastMonthUnits ? ((totalUnits - lastMonthUnits) / lastMonthUnits) * 100 : 0 : -90;
  const stockPercentage = hasStockData ? lastMonthUnits ? (totalUnits / lastMonthUnits) * 100 : totalUnits > 0 ? 100 : 0 : 10;
  const displayedStockSize = hasStockData ? totalUnits : 60;
  const formattedPercentage = `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(stockPercentage)}%`;
  const formattedTotal = new Intl.NumberFormat("en").format(displayedStockSize);
  const formattedChange = new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(Math.abs(change));
  const ChangeIcon = change > 0 ? TrendingUp : TrendingDown;

  const salesByProduct = products.map((product) => ({
    ...product,
    sold: movements.reduce((sold, movement) => movement.productId === product.id && movement.quantity < 0 ? sold + Math.abs(movement.quantity) : sold, 0),
  }));
  const totalSold = salesByProduct.reduce((total, product) => total + product.sold, 0);
  const rankedProducts = [...salesByProduct].sort((first, second) => second.sold - first.sold);
  const mostSelling = rankedProducts[0];
  const leastSelling = rankedProducts.length > 1 ? rankedProducts[rankedProducts.length - 1] : rankedProducts[0];

  return <div className="stock-summary-grid">
    <article className="stock-summary-card" aria-label="Total stock status">
      <span className="stock-summary-title">Stock status</span>
      <span className="stock-summary-icon stock-status-icon"><StockStatusIcon /></span>
      <div className="stock-summary-value-row">
        <strong>{loading || error ? "—" : formattedPercentage}</strong>
        {!loading && !error && <span className={`stock-summary-change${change > 0 ? " increase" : change < 0 ? " decrease" : ""}`}>
          {change !== 0 && <ChangeIcon aria-hidden="true" />}{formattedChange}%
        </span>}
      </div>
      <span className="stock-summary-previous">Stock size: <strong>{loading || error ? "—" : formattedTotal}</strong></span>
    </article>
    {!loading && !error && <SellingCard title="Most selling item" itemName={mostSelling?.name || "Zara Jeans"} percentage={totalSold && mostSelling ? (mostSelling.sold / totalSold) * 100 : 72} remainingStock={mostSelling?.quantity ?? 60} tone="best" />}
    {!loading && !error && <SellingCard title="Least selling item" itemName={leastSelling?.name || "Nike Shorts"} percentage={totalSold && leastSelling ? (leastSelling.sold / totalSold) * 100 : 10} remainingStock={leastSelling?.quantity ?? 60} tone="least" />}
  </div>;
}
