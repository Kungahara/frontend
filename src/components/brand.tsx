import Image from "next/image";
import Link from "next/link";

export function Brand({ subtitle }: { subtitle?: string | null }) {
  return (
    <Link className={`brand${subtitle ? " brand-with-subtitle" : ""}`} href="/" aria-label="Kungahara home">
      <Image className="brand-mark" src="/images/kungahara-logo.png" alt="" width={1081} height={796} priority />
      <span className="brand-copy"><span>Kungahara</span>{subtitle && <small>{subtitle}</small>}</span>
    </Link>
  );
}
