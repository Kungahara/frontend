"use client";

import { BadgeDollarSign, Banknote, Coins, Pencil, Plus, Trash2, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { apiErrorMessage } from "@/lib/api/client";
import { MoneyAmount } from "@/components/money-amount";
import { inventoryFetch } from "@/lib/inventory-client";

import { MoneySortButton, type SortDirection } from "@/components/money-sort-button";

type Period = "month" | "year";
type Product = { id: string; quantity: number; costPrice: string };
type Sale = { productId: string; quantity: number; unitPrice: string; createdAt: string };
type Movement = { productId: string; type: string; quantity: number; createdAt: string };
type Loan = { id: string; source: string; amount: string; borrowedOn: string; deadline: string; interestRate: string };
type LoanForm = { source: string; amount: string; borrowedOn: string; deadline: string; interestRate: string };

const today = new Date().toISOString().slice(0, 10);
const emptyLoan: LoanForm = { source: "", amount: "", borrowedOn: today, deadline: "", interestRate: "0" };
const responsiveMoney = (value: number) => <MoneyAmount value={value} />;

function inPeriod(value: string, period: Period) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && (period === "year" || date.getMonth() === now.getMonth());
}

export function FinanceOverview() {
  const loadingText = useTranslations("Loading");
  const commonText = useTranslations("Common");
  const [period, setPeriod] = useState<Period>("month");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [form, setForm] = useState<LoanForm>(emptyLoan);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loanSort, setLoanSort] = useState<{ key: "amount" | "interest"; direction: Exclude<SortDirection, null> } | null>(null);

  useEffect(() => {
    Promise.all(["/api/products", "/api/sales", "/api/stock-movements", "/api/loans"].map((path) => inventoryFetch(path).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "Unable to load finance data."));
      return body;
    }))).then(([productBody, saleBody, movementBody, loanBody]) => {
      setProducts(productBody.products ?? []); setSales(saleBody.sales ?? []);
      setMovements(movementBody.stockMovements ?? []); setLoans(loanBody.loans ?? []);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load finance data.")).finally(() => setLoading(false));
  }, []);

  const periodLoans = useMemo(() => loans.filter((loan) => inPeriod(loan.deadline, period)), [loans, period]);

  const summary = useMemo(() => {
    const costs = new Map(products.map((product) => [product.id, Number(product.costPrice)]));
    const selectedSales = sales.filter((sale) => inPeriod(sale.createdAt, period));
    const invested = movements.filter((movement) => movement.type === "stock_in" && movement.quantity > 0 && inPeriod(movement.createdAt, period))
      .reduce((total, movement) => total + movement.quantity * (costs.get(movement.productId) ?? 0), 0);
    const income = selectedSales.reduce((total, sale) => total + sale.quantity * Number(sale.unitPrice), 0);
    const costOfSales = selectedSales.reduce((total, sale) => total + sale.quantity * (costs.get(sale.productId) ?? 0), 0);
    return { invested, income, profit: income - costOfSales, loans: periodLoans.reduce((total, loan) => total + Number(loan.amount), 0) };
  }, [movements, period, periodLoans, products, sales]);

  function openAddLoan() { setEditingLoanId(null); setForm(emptyLoan); setError(""); setDialogOpen(true); }
  function openEditLoan(loan: Loan) {
    setEditingLoanId(loan.id);
    setForm({ source: loan.source, amount: loan.amount, borrowedOn: loan.borrowedOn, deadline: loan.deadline, interestRate: loan.interestRate });
    setError(""); setDialogOpen(true);
  }
  function closeLoanDialog() { setDialogOpen(false); setEditingLoanId(null); setForm(emptyLoan); setError(""); }

  async function saveLoan() {
    setSaving(true); setError("");
    try {
      const response = await inventoryFetch(editingLoanId ? `/api/loans/${editingLoanId}` : "/api/loans", { method: editingLoanId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "Unable to save the loan."));
      setLoans((current) => editingLoanId ? current.map((loan) => loan.id === editingLoanId ? body.loan : loan) : [...current, body.loan]); closeLoanDialog();
      window.dispatchEvent(new CustomEvent("kungahara:data-changed"));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save the loan."); } finally { setSaving(false); }
  }

  async function removeLoan(id: string) {
    const response = await inventoryFetch(`/api/loans/${id}`, { method: "DELETE" });
    if (response.ok) { setLoans((current) => current.filter((loan) => loan.id !== id)); window.dispatchEvent(new CustomEvent("kungahara:data-changed")); }
    else setError("Unable to remove the loan.");
  }

  const cards = [
    { title: `Money invested this ${period}`, value: summary.invested, description: "Stock purchased", icon: Coins, tone: "blue" },
    { title: `Income this ${period}`, value: summary.income, description: "Money from sales", icon: BadgeDollarSign, tone: "green" },
    { title: `Profit this ${period}`, value: summary.profit, description: `Profit made this ${period}`, icon: WalletCards, tone: "profit" },
    { title: "Money in loans", value: summary.loans, description: `${periodLoans.length} loan${periodLoans.length === 1 ? "" : "s"} due this ${period}`, icon: Banknote, tone: "red" },
  ];

  const sortedLoans = loanSort ? [...periodLoans].sort((a, b) => {
    const difference = loanSort.key === "amount" ? Number(a.amount) - Number(b.amount) : Number(a.interestRate) - Number(b.interestRate);
    return difference * (loanSort.direction === "asc" ? 1 : -1);
  }) : periodLoans;
  const toggleLoanSort = (key: "amount" | "interest") => setLoanSort((current) => ({ key, direction: current?.key === key && current.direction === "asc" ? "desc" : "asc" }));

  if (loading) return <div className="sales-page-loading" role="status"><span /><strong>{loadingText("finance")}</strong><small>{loadingText("financeBody")}</small></div>;
  return <div className="finance-page-content">
    <div className="finance-summary-grid">{cards.map(({ title, value, description, icon: Icon, tone }) => { const blueCard = tone === "blue"; return <article className={`stock-summary-card finance-summary-card ${tone}${blueCard ? " stock-value-card" : ""}`} key={title}><span className="stock-summary-title">{title}</span><span className="stock-summary-icon finance-card-icon"><Icon aria-hidden="true" /></span><div className={blueCard ? "stock-value-amount" : "stock-summary-value-row"}>{blueCard ? responsiveMoney(value) : <strong>{responsiveMoney(value)}</strong>}</div><span className={blueCard ? "historical-card-note" : "stock-summary-previous"}>{description}</span></article>; })}</div>
    <nav className="sales-view-tabs finance-period-tabs" aria-label="Finance period"><button className={period === "month" ? "active" : ""} type="button" aria-pressed={period === "month"} onClick={() => setPeriod("month")}>This month</button><button className={period === "year" ? "active" : ""} type="button" aria-pressed={period === "year"} onClick={() => setPeriod("year")}>This year</button></nav>
    <section className="stock-product-panel finance-loans-panel"><header className="stock-product-toolbar"><div><h2>Loans</h2><p className="finance-table-subtitle">Money borrowed for the business and upcoming payment reminders.</p></div><button className="stock-add-product" type="button" onClick={openAddLoan}><Plus />Add loan</button></header>
      {error && <p className="stock-product-error" role="alert">{error}</p>}
      <div className="stock-product-table-wrap"><table className="stock-product-table finance-loans-table"><thead><tr><th>Source / name</th><th aria-sort={loanSort?.key === "amount" ? loanSort.direction === "asc" ? "ascending" : "descending" : "none"}><MoneySortButton label="Amount" direction={loanSort?.key === "amount" ? loanSort.direction : null} onToggle={() => toggleLoanSort("amount")} /></th><th>Loan date</th><th>Deadline</th><th aria-sort={loanSort?.key === "interest" ? loanSort.direction === "asc" ? "ascending" : "descending" : "none"}><MoneySortButton label="Interest rate" direction={loanSort?.key === "interest" ? loanSort.direction : null} onToggle={() => toggleLoanSort("interest")} /></th><th>Action</th></tr></thead><tbody className={periodLoans.length ? "" : "empty"}>{periodLoans.length ? sortedLoans.map((loan) => <tr key={loan.id}><td><strong>{loan.source}</strong></td><td><MoneyAmount value={Number(loan.amount)} /></td><td>{new Date(`${loan.borrowedOn}T00:00:00`).toLocaleDateString("en-GB")}</td><td>{new Date(`${loan.deadline}T00:00:00`).toLocaleDateString("en-GB")}</td><td>{Number(loan.interestRate)}%</td><td><div className="stock-row-actions"><button type="button" aria-label={`Edit ${loan.source} loan`} onClick={() => openEditLoan(loan)}><Pencil /></button><button className="danger" type="button" aria-label={`Delete ${loan.source} loan`} onClick={() => void removeLoan(loan.id)}><Trash2 /></button></div></td></tr>) : <tr><td className="stock-product-empty" colSpan={6}><div className="stock-empty-state"><Banknote /><strong>No loans due this {period}</strong><p>Loans appear here when their repayment deadline falls within the selected period.</p><button type="button" onClick={openAddLoan}><Plus />Add loan</button></div></td></tr>}</tbody></table></div>
    </section>
    {dialogOpen && <div className="stock-delete-backdrop"><form className="stock-delete-dialog stock-add-dialog" onSubmit={(event) => { event.preventDefault(); void saveLoan(); }}><button className="stock-delete-close" type="button" onClick={closeLoanDialog}><X /></button><h3>{editingLoanId ? "Edit loan" : "Add a loan"}</h3><p>{editingLoanId ? "Update the loan details and its automatic reminder schedule." : "Record where the money came from and when you need to repay it. Reminders are scheduled automatically."}</p><div className="stock-add-grid"><label className="stock-form-wide">Name or money source<input required value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} /></label><label>Amount (RWF)<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label>Interest rate (%)<input required min="0" max="100" step="0.01" type="number" value={form.interestRate} onChange={(event) => setForm({ ...form, interestRate: event.target.value })} /></label><label>Loan date<input required type="date" value={form.borrowedOn} onChange={(event) => setForm({ ...form, borrowedOn: event.target.value })} /></label><label>Deadline<input required min={form.borrowedOn} type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></label></div>{error && <p className="stock-add-note" role="alert">{error}</p>}<button className="stock-add-submit" disabled={saving}>{saving ? commonText("saving") : editingLoanId ? "Update loan" : "Save loan"}</button></form></div>}
  </div>;
}
