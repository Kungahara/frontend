import Image from "next/image";
import Link from "next/link";
import type { MouseEventHandler } from "react";

export function Brand({ subtitle, ariaLabel = "Kungahara home", onClick }: { subtitle?: string | null; ariaLabel?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <Link className={`brand${subtitle ? " brand-with-subtitle" : ""}`} href="/" aria-label={ariaLabel} onClick={onClick}>
      <Image className="brand-mark" src="/images/kungahara-logo-optimized.png" alt="" width={320} height={320} priority unoptimized />
      <span className="brand-copy"><span>Kungahara</span>{subtitle && <small>{subtitle}</small>}</span>
    </Link>
  );
}
