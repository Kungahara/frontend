import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";

export default function NotFound() {
  return <main className="not-found-page">
    <Link className="not-found-brand" href="/" aria-label="Kungahara home"><Brand /></Link>
    <section className="not-found-content">
      <span className="not-found-code" aria-hidden="true">404</span>
      <p className="not-found-pill">Page not found</p>
      <h1>This page has wandered<br /><em>out of the workspace.</em></h1>
      <p>The address may be incorrect, or the page may have moved. Your Kungahara workspace is still right where you left it.</p>
      <div className="not-found-actions">
        <Link className="not-found-secondary" href="/"><ArrowLeft aria-hidden="true" />Go back</Link>
        <Link className="not-found-primary" href="/"><Home aria-hidden="true" />Take me home</Link>
      </div>
    </section>
  </main>;
}
