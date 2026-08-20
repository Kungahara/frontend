import Image from "next/image";
import Link from "next/link";

export function Brand({ subtitle }: { subtitle?: string | null }) {
  return (
    <Link className={`brand${subtitle ? " brand-with-subtitle" : ""}`} href="/" aria-label="Kungahara home">
      <Image className="brand-mark" src="/images/kungahara-logo-optimized.png" alt="" width={320} height={320} priority unoptimized />
      <span className="brand-copy"><span>Kungahara</span>{subtitle && <small>{subtitle}</small>}</span>
    </Link>
  );
}
