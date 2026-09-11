type LegalLink = { id: string; title: string };

export function LegalTableOfContents({ heading, ariaLabel, sections }: { heading: string; ariaLabel: string; sections: LegalLink[] }) {
  return <div className="legal-toc-slot">
    <aside className="legal-toc">
      <p>{heading}</p>
      <nav aria-label={ariaLabel}>{sections.map((section, index) => <a href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>)}</nav>
    </aside>
  </div>;
}
