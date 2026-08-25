import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";

export type LegalSection = { id: string; title: string; content: React.ReactNode };

export function LegalDocumentLayout({ label, title, summary, sections }: { label: string; title: string; summary: string; sections: LegalSection[] }) {
  return <main className="legal-page">
    <header className="legal-header"><Brand /><Link href="/"><ArrowLeft aria-hidden="true" />Back to home</Link></header>
    <section className="legal-hero">
      <span className="legal-orb one" aria-hidden="true" /><span className="legal-orb two" aria-hidden="true" />
      <div><p className="legal-eyebrow">{label}</p><h1>{title}</h1><p>{summary}</p><small>Effective August 25, 2026</small></div>
    </section>
    <div className="legal-layout">
      <aside className="legal-toc"><p>On this page</p><nav aria-label={`${title} sections`}>{sections.map((section, index) => <a href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>)}</nav></aside>
      <article className="legal-document">
        {sections.map((section, index) => <section id={section.id} key={section.id}><p className="legal-section-number">{String(index + 1).padStart(2, "0")}</p><h2>{section.title}</h2><div>{section.content}</div></section>)}
        <div className="legal-contact-card"><span><Mail aria-hidden="true" /></span><div><h2>Questions?</h2><p>Contact Kungahara about this document at <a href="mailto:hervendizeye0@gmail.com">hervendizeye0@gmail.com</a>.</p></div></div>
      </article>
    </div>
  </main>;
}
