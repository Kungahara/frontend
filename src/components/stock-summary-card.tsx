"use client";

import { Coins, PackageMinus, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { inventoryFetch } from "@/lib/inventory-client";
import { formatCompactRwf, formatRwf } from "@/lib/format-money";

type Product = { id: string; name: string; quantity: number; costPrice: string; sellingPrice: string };
type StockMovement = { productId: string; type: "stock_in" | "adjustment"; quantity: number; createdAt: string };
type SaleRecord = { productId: string; quantity: number; unitPrice: string; createdAt: string };

export function StockStatusIcon() {
  return <svg viewBox="0 0 27.948 27.948" fill="currentColor" aria-hidden="true">
    <path d="M9.689 19.484h15.503v1.936H8.133L4.99 7.153H.69V5.218h5.854l3.145 14.266Zm1.761 3.224a2.62 2.62 0 1 0 0 5.24 2.62 2.62 0 0 0 0-5.24Zm10.8 0a2.62 2.62 0 1 0 0 5.24 2.62 2.62 0 0 0 0-5.24Zm-11.582-4.673L8.37 6.133h3.76L20.463 0l3.729 5.064-.161 1.069h3.227l-2.687 11.902H10.668Zm12.916-12.558-.892.656h.794l.098-.656Zm-10.546.655h1.958l-.117-.16.379-.279.324.439h.48l-.492-.669.38-.279.697.948h.544l-.89-1.207.381-.279 1.095 1.486h.626l-1.301-1.768.379-.28 1.507 2.048h.544l-1.697-2.308.379-.278 1.902 2.586h1.668l1.639-1.205-3.07-4.176-7.315 5.381Zm8.712-.827-2.088-2.839-.382.279 2.089 2.839.381-.279Zm-.73.54-2.09-2.84-.379.279 2.092 2.839.377-.278Z" />
  </svg>;
}

function SellingCard({ title, itemName, percentage, remainingStock, tone }: { title: string; itemName?: string; percentage: number; remainingStock: number; tone: "best" | "least" }) {
  return <article className={`stock-summary-card selling-summary-card ${tone}`} aria-label={title}>
    <span className="stock-summary-title">{title}</span>
    <span className="stock-summary-icon selling-summary-icon"><ShoppingBag aria-hidden="true" /></span>
    <div className="stock-summary-value-row">
      <strong>{new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(percentage)}%</strong>
      <span className="selling-item-name">{itemName || "No sales yet"}</span>
    </div>
    <span className="stock-summary-previous">Remaining Stock: <strong>{new Intl.NumberFormat("en").format(remainingStock)}</strong></span>
  </article>;
}

function StockValueCard({ products, movements }: { products: Product[]; movements: StockMovement[] }) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const calculatedCurrentValue = products.reduce((total, product) => total + product.quantity * Number(product.costPrice), 0);
  const currentValue = calculatedCurrentValue;
  const movementValueThisMonth = movements.reduce((total, movement) => {
    if (new Date(movement.createdAt) < startOfMonth) return total;
    const product = products.find((item) => item.id === movement.productId);
    return total + movement.quantity * Number(product?.costPrice ?? 0);
  }, 0);
  const lastMonthValue = Math.max(0, currentValue - movementValueThisMonth);
  const change = lastMonthValue ? ((currentValue - lastMonthValue) / lastMonthValue) * 100 : currentValue > 0 ? 100 : 0;
  const ChangeIcon = change >= 0 ? TrendingUp : TrendingDown;
  const formattedValue = formatRwf(currentValue);
  const compactValue = formatCompactRwf(currentValue);

  return <article className="stock-summary-card stock-value-card" aria-label="Stock value">
    <span className="stock-summary-title">Stock value</span>
    <span className="stock-summary-icon stock-value-icon"><Coins aria-hidden="true" /></span>
    <div className="stock-value-amount"><span className="dashboard-money-full">{formattedValue}</span><span className="dashboard-money-compact">{compactValue}</span></div>
    <div className="stock-value-comparison">
      <span className={`stock-summary-change${change >= 0 ? " increase" : " decrease"}`}><ChangeIcon aria-hidden="true" />{new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(Math.abs(change))}%</span><span>than last month</span>
    </div>
  </article>;
}

function LeastStockCard({ product }: { product?: Product }) {
  return <article className="stock-summary-card least-stock-card" aria-label="Least item in stock">
    <span className="stock-summary-title">Least item in stock</span>
    <span className="stock-summary-icon least-stock-icon"><PackageMinus aria-hidden="true" /></span>
    <div className="least-stock-name"><span>{product?.name || "No products"}</span></div>
    <span className="least-stock-remaining">Remaining stock: <strong>{new Intl.NumberFormat("en").format(product?.quantity ?? 0)}</strong></span>
  </article>;
}

function SalesSummaryCards({ products, sales }: { products: Product[]; sales: SaleRecord[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const inRange = (sale: SaleRecord, start: Date, end: Date) => {
    const createdAt = new Date(sale.createdAt);
    return createdAt >= start && createdAt < end;
  };
  const saleValue = (sale: SaleRecord) => sale.quantity * Number(sale.unitPrice);
  const todaySales = sales.filter((sale) => inRange(sale, today, tomorrow));
  const yesterdaySales = sales.filter((sale) => inRange(sale, yesterday, today));
  const todayValue = todaySales.reduce((total, sale) => total + saleValue(sale), 0);
  const yesterdayValue = yesterdaySales.reduce((total, sale) => total + saleValue(sale), 0);
  const valueChange = yesterdayValue ? ((todayValue - yesterdayValue) / yesterdayValue) * 100 : todayValue > 0 ? 100 : 0;
  const ValueChangeIcon = valueChange >= 0 ? TrendingUp : TrendingDown;
  const soldQuantity = todaySales.reduce((total, sale) => total + sale.quantity, 0);
  const todayByProduct = products.map((product) => {
    const productSales = todaySales.filter((sale) => sale.productId === product.id);
    const quantity = productSales.reduce((total, sale) => total + sale.quantity, 0);
    return { ...product, soldToday: quantity, moneyToday: productSales.reduce((total, sale) => total + saleValue(sale), 0) };
  });
  const mostSelling = [...todayByProduct].sort((first, second) => second.soldToday - first.soldToday)[0];
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lossThisMonth = sales.filter((sale) => new Date(sale.createdAt) >= startOfMonth).reduce((total, sale) => {
    const product = products.find((item) => item.id === sale.productId);
    return total + Math.max(0, Number(product?.costPrice ?? 0) - Number(sale.unitPrice)) * sale.quantity;
  }, 0);
  const responsiveMoney = (value: number) => <><span className="dashboard-money-full">{formatRwf(value)}</span><span className="dashboard-money-compact">{formatCompactRwf(value)}</span></>;

  return <div className="stock-summary-grid sales-summary-grid">
    <article className="stock-summary-card stock-value-card" aria-label="Sold stock value">
      <span className="stock-summary-title">Sold stock value</span>
      <span className="stock-summary-icon stock-value-icon"><Coins aria-hidden="true" /></span>
      <div className="stock-value-amount">{responsiveMoney(todayValue)}</div>
      <div className="stock-value-comparison"><span className={`stock-summary-change${valueChange >= 0 ? " increase" : " decrease"}`}><ValueChangeIcon aria-hidden="true" />{new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(Math.abs(valueChange))}%</span><span>than yesterday</span></div>
    </article>
    <article className="stock-summary-card selling-summary-card best sales-most-selling-card" aria-label="Most selling item">
      <span className="stock-summary-title">Most selling item</span>
      <span className="stock-summary-icon selling-summary-icon"><ShoppingBag aria-hidden="true" /></span>
      <div className="stock-summary-value-row sales-item-value-row"><strong className="sales-item-value">{responsiveMoney(mostSelling?.moneyToday ?? 0)}</strong><span className="selling-item-name">{mostSelling?.soldToday ? mostSelling.name : "No sales today"}</span></div>
      <span className="stock-summary-previous">Money made today{mostSelling?.soldToday ? <> · <strong>{mostSelling.soldToday}</strong> sold</> : ""}</span>
    </article>
    <article className="stock-summary-card" aria-label="Sold items quantity">
      <span className="stock-summary-title">Sold items quantity</span>
      <span className="stock-summary-icon stock-status-icon"><StockStatusIcon /></span>
      <div className="stock-summary-value-row"><strong>{new Intl.NumberFormat("en").format(soldQuantity)}</strong></div>
      <span className="stock-summary-previous">Items sold today</span>
    </article>
    <article className="stock-summary-card least-stock-card sales-loss-card" aria-label="Losses suffered this month">
      <span className="stock-summary-title">Losses suffered</span>
      <span className="stock-summary-icon least-stock-icon"><TrendingDown aria-hidden="true" /></span>
      <div className="stock-value-amount">{responsiveMoney(lossThisMonth)}</div>
      <span className="least-stock-remaining">Money lost this month</span>
    </article>
  </div>;
}

export function StockSummaryCard({ variant = "stock", onSettled }: { variant?: "stock" | "sales"; onSettled?: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadedOnce = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let requestVersion = 0;
    function loadStock() {
      const version = ++requestVersion;
      if (!loadedOnce.current) setLoading(true);
      setError(false);
      void Promise.all([
        inventoryFetch("/api/products", { signal: controller.signal }),
        inventoryFetch("/api/stock-movements", { signal: controller.signal }),
        inventoryFetch("/api/sales", { signal: controller.signal }),
      ]).then(async ([productsResponse, movementsResponse, salesResponse]) => {
        if (!productsResponse.ok || !movementsResponse.ok || !salesResponse.ok) throw new Error("Unable to load stock");
        const [productsBody, movementsBody, salesBody] = await Promise.all([productsResponse.json(), movementsResponse.json(), salesResponse.json()]);
        if (!active || version !== requestVersion) return;
        setProducts(Array.isArray(productsBody.products) ? productsBody.products : []);
        setMovements(Array.isArray(movementsBody.stockMovements) ? movementsBody.stockMovements : []);
        setSales(Array.isArray(salesBody.sales) ? salesBody.sales : []);
      }).catch((requestError) => {
        if (!active || version !== requestVersion) return;
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        if (!loadedOnce.current) setError(true);
      }).finally(() => {
        if (active && version === requestVersion) {
          loadedOnce.current = true;
          setLoading(false);
        }
      });
    }
    loadStock();
    window.addEventListener("kungahara:inventory-changed", loadStock);
    return () => { active = false; controller.abort(); window.removeEventListener("kungahara:inventory-changed", loadStock); };
  }, []);

  useEffect(() => {
    if (!loading) onSettled?.();
  }, [loading, onSettled]);

  if (loading) return <div className="sales-page-loading" role="status" aria-live="polite"><span aria-hidden="true" /><strong>{variant === "sales" ? "Loading sales data…" : "Loading stock data…"}</strong><small>Please wait while we prepare your summary.</small></div>;
  if (error) return <div className="sales-page-loading" role="alert"><strong>Unable to load this summary.</strong><small>Please refresh the page and try again.</small></div>;

  const totalUnits = products.reduce((total, product) => total + product.quantity, 0);
  const totalSoldUnits = sales.reduce((total, sale) => total + sale.quantity, 0);
  const totalEnteredUnits = totalUnits + totalSoldUnits;
  const hasStockData = products.length > 0;
  const stockPercentage = hasStockData && totalEnteredUnits ? (totalUnits / totalEnteredUnits) * 100 : 0;
  const change = stockPercentage - (hasStockData ? 100 : 0);
  const displayedStockSize = totalUnits;
  const formattedPercentage = `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(stockPercentage)}%`;
  const formattedTotal = new Intl.NumberFormat("en").format(displayedStockSize);
  const formattedChange = new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(Math.abs(change));
  const ChangeIcon = change > 0 ? TrendingUp : TrendingDown;

  const salesByProduct = products.map((product) => ({
    ...product,
    sold: sales.reduce((sold, sale) => sale.productId === product.id ? sold + sale.quantity : sold, 0),
    supplied: movements.reduce((supplied, movement) => movement.productId === product.id && movement.type === "stock_in" ? supplied + movement.quantity : supplied, 0),
  }));
  const rankedProducts = [...salesByProduct].sort((first, second) => second.sold - first.sold);
  const mostSelling = rankedProducts[0];
  const leastSelling = rankedProducts.length > 1 ? rankedProducts[rankedProducts.length - 1] : rankedProducts[0];
  const leastStockProduct = [...products].sort((first, second) => first.quantity - second.quantity)[0];

  if (variant === "sales") return <SalesSummaryCards products={products} sales={sales} />;

  return <div className="stock-summary-grid">
    <StockValueCard products={products} movements={movements} />
    <article className="stock-summary-card" aria-label="Total stock status">
      <span className="stock-summary-title">Stock status</span>
      <span className="stock-summary-icon stock-status-icon"><StockStatusIcon /></span>
      <div className="stock-summary-value-row">
        <strong>{formattedPercentage}</strong>
        <span className={`stock-summary-change${change > 0 ? " increase" : change < 0 ? " decrease" : ""}`}>
          {change !== 0 && <ChangeIcon aria-hidden="true" />}{formattedChange}%
        </span>
      </div>
      <span className="stock-summary-previous">Stock size: <strong>{formattedTotal}</strong></span>
    </article>
    <SellingCard title="Most selling item" itemName={mostSelling?.name} percentage={mostSelling?.sold ? Math.min(100, (mostSelling.sold / (mostSelling.supplied || mostSelling.quantity + mostSelling.sold)) * 100) : 0} remainingStock={mostSelling?.quantity ?? 0} tone="best" />
    <SellingCard title="Least selling item" itemName={leastSelling?.name} percentage={leastSelling?.sold ? Math.min(100, (leastSelling.sold / (leastSelling.supplied || leastSelling.quantity + leastSelling.sold)) * 100) : 0} remainingStock={leastSelling?.quantity ?? 0} tone="least" />
    <LeastStockCard product={leastStockProduct} />
  </div>;
}
