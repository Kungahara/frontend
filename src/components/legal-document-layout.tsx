import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { LegalTableOfContents } from "@/components/legal-table-of-contents";
import { getTranslations } from "next-intl/server";

export type LegalSection = { id: string; title: string; content: React.ReactNode };

export async function LegalDocumentLayout({ label, title, summary, sections }: { label: string; title: string; summary: string; sections: LegalSection[] }) {
  const t = await getTranslations("Legal");
  return <main className="legal-page">
    <header className="legal-header"><Brand ariaLabel={t("kungaharaHome")} /><Link href="/"><ArrowLeft aria-hidden="true" />{t("backHome")}</Link></header>
    <section className="legal-hero">
      <span className="legal-orb one" aria-hidden="true" /><span className="legal-orb two" aria-hidden="true" />
      <div><p className="legal-eyebrow">{label}</p><h1>{title}</h1><p>{summary}</p><small>{t("effectiveDate")}</small></div>
    </section>
    <div className="legal-layout">
      <LegalTableOfContents heading={t("onThisPage")} ariaLabel={t("sectionsLabel", { title })} sections={sections.map(({ id, title: sectionTitle }) => ({ id, title: sectionTitle }))} />
      <article className="legal-document">
        {sections.map((section, index) => <section id={section.id} key={section.id}><p className="legal-section-number">{String(index + 1).padStart(2, "0")}</p><h2>{section.title}</h2><div>{section.content}</div></section>)}
        <div className="legal-contact-card"><span><Mail aria-hidden="true" /></span><div><h2>{t("questions")}</h2><p>{t("contact")} <a href="mailto:hervendizeye0@gmail.com">hervendizeye0@gmail.com</a>.</p></div></div>
      </article>
    </div>
  </main>;
}
