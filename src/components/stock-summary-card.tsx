"use client";

import { ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

type Product = { id: string; name: string; quantity: number };
type StockMovement = { productId: string; quantity: number; createdAt: string };

function StockStatusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.2 4.4h3.1l1.4 10.2c.1.9.9 1.6 1.8 1.6h8.7" />
    <path d="M7 7.2h11.8l-1.5 6.2c-.2.8-.9 1.3-1.7 1.3H8.2" />
    <path d="M8.1 7.2c.4-2 2-3.4 3.9-3.4h1.9c2 0 3.6 1.4 4 3.4" />
    <path d="M9.2 7.2V6.1c0-.7.6-1.3 1.3-1.3h4.8c.7 0 1.3.6 1.3 1.3v1.1" />
    <path d="M18.8 7.2 21.4 2" />
    <path d="M8.4 18.3h9.8" />
    <circle cx="8.3" cy="20" r="1.2" />
    <circle cx="18.4" cy="20" r="1.2" />
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
