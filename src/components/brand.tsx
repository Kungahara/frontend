import Link from "next/link";

export function Brand({ subtitle }: { subtitle?: string | null }) {
  return (
    <Link className={`brand${subtitle ? " brand-with-subtitle" : ""}`} href="/" aria-label="Kungahara home">
      <span className="brand-mark" aria-hidden="true">K</span>
      <span className="brand-copy"><span>Kungahara</span>{subtitle && <small>{subtitle}</small>}</span>
    </Link>
  );
}
