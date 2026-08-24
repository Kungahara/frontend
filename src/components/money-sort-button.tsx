import { ChevronDown, ChevronUp } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

export function MoneySortButton({ direction, label, onToggle }: { direction: SortDirection; label: string; onToggle: () => void }) {
  const state = direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "not sorted";
  return <button className="money-sort-button" type="button" aria-label={`Sort ${label} (${state})`} onClick={onToggle}>
    <span>{label}</span><span className="money-sort-arrows" aria-hidden="true"><ChevronUp className={direction === "asc" ? "active" : ""} /><ChevronDown className={direction === "desc" ? "active" : ""} /></span>
  </button>;
}
