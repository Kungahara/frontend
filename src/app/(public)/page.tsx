import Link from "next/link";

import { Brand } from "@/components/brand";

export default function HomePage() {
  return (
    <main className="landing">
      <header className="public-header">
        <Brand />
        <nav aria-label="Primary navigation">
          <Link href="/login">Sign in</Link>
          <Link className="button button-small" href="/dashboard">Open workspace</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Built for Rwanda&apos;s agricultural community</p>
          <h1>Good harvests deserve better connections.</h1>
          <p className="hero-description">
            Kungahara is being shaped as a trusted place for growers, buyers,
            and partners to coordinate opportunity from field to market.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/login">Get started</Link>
            <a className="text-link" href="http://127.0.0.1:8000/api/health/">
              Check backend health <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="hero-panel" aria-label="Application foundation status">
          <span className="status-dot" />
          <p>Foundation ready</p>
          <strong>Routes, API access, and protected workspaces are in place.</strong>
          <dl>
            <div><dt>Backend</dt><dd>Django</dd></div>
            <div><dt>Database</dt><dd>PostgreSQL</dd></div>
            <div><dt>Frontend</dt><dd>Next.js</dd></div>
          </dl>
        </div>
      </section>
    </main>
  );
}
