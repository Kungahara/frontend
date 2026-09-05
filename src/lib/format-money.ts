const fullRwfFormatter = new Intl.NumberFormat("en-RW", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactRwfFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatRwf(value: number) {
  return `${fullRwfFormatter.format(Number.isFinite(value) ? value : 0)} RWF`;
}

export function formatCompactRwf(value: number) {
  return `${compactRwfFormatter.format(Number.isFinite(value) ? value : 0)} RWF`;
}
