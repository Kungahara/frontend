import { FitText } from "@/components/fit-text";
import { formatRwf } from "@/lib/format-money";

export function MoneyAmount({ value }: { value: number }) {
  return <FitText text={formatRwf(value)} className="money-amount" />;
}
