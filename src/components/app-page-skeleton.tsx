type SkeletonVariant = "dashboard" | "stock" | "sales" | "sales-analytics" | "finance" | "documents" | "settings" | "help";

function Line({ size = "medium" }: { size?: "short" | "medium" | "long" }) {
  return <span className={`app-skeleton-line ${size}`} />;
}

function Cards({ count }: { count: number }) {
  return <div className="app-skeleton-cards">{Array.from({ length: count }, (_, index) => <span className="app-skeleton-card" key={index}>
    <i className="app-skeleton-circle" /><Line size="short" /><Line size="long" /><Line size="medium" />
  </span>)}</div>;
}

export function AppSummarySkeleton({ count, className = "" }: { count: number; className?: string }) {
  return <div className={`app-skeleton-cards ${className}`.trim()} aria-hidden="true">{Array.from({ length: count }, (_, index) => <span className="app-skeleton-card" key={index}>
    <i className="app-skeleton-circle" /><Line size="short" /><Line size="long" /><Line size="medium" />
  </span>)}</div>;
}

function TableRows({ count = 5, columns = 5 }: { count?: number; columns?: number }) {
  return <div className={`app-skeleton-table columns-${columns}`}>{Array.from({ length: count }, (_, row) => <span className="app-skeleton-table-row" key={row}>
    {Array.from({ length: columns }, (_, column) => <i key={column} />)}
  </span>)}</div>;
}

export function AppTableSkeleton({ count = 5 }: { count?: number }) {
  return <TableRows count={count} />;
}

export function AppPageSkeleton({ variant, label, embedded = false }: { variant: SkeletonVariant; label: string; embedded?: boolean }) {
  if (variant === "settings") return <div className={`app-page-skeleton settings${embedded ? " embedded" : ""}`} role="status" aria-label={label} aria-busy="true">
    {Array.from({ length: 6 }, (_, section) => <section className="app-skeleton-settings-section" key={section}>
      <header><span className="app-skeleton-circle" /><div><Line size="short" /><Line size="medium" /></div></header>
      {section === 4 ? <div className="app-skeleton-team-grid">{Array.from({ length: 2 }, (_, card) => <span key={card}><i className="app-skeleton-circle" /><b><Line size="long" /><Line size="short" /></b><em /></span>)}</div> : Array.from({ length: [2, 3, 3, 1, 0, 2][section] }, (_, row) => <div className="app-skeleton-settings-row" key={row}><div><Line size="medium" /><Line size="long" /></div><span className="app-skeleton-control" /></div>)}
    </section>)}
  </div>;

  if (variant === "help") return <div className={`app-page-skeleton help${embedded ? " embedded" : ""}`} role="status" aria-label={label} aria-busy="true">
    <Line size="medium" />
    {Array.from({ length: 5 }, (_, row) => <span className="app-skeleton-help-row" key={row}><i /><Line size="long" /><b /></span>)}
    <span className="app-skeleton-help-card"><div><Line size="short" /><Line size="medium" /></div><span /></span>
  </div>;

  const cardCount = variant === "stock" ? 5 : 4;
  return <div className={`app-page-skeleton ${variant}${embedded ? " embedded" : ""}`} role="status" aria-label={label} aria-busy="true">
    <Cards count={cardCount} />
    {variant !== "dashboard" && <div className="app-skeleton-tabs"><span /><span /><span /></div>}
    {variant === "documents" ? <div className="app-skeleton-documents"><section><header><Line size="short" /><span className="app-skeleton-search" /></header><div className="app-skeleton-photo-grid">{Array.from({ length: 4 }, (_, item) => <i key={item} />)}</div></section><aside>{Array.from({ length: 4 }, (_, item) => <i key={item} />)}</aside></div>
      : variant === "dashboard" ? <div className="app-skeleton-dashboard-lower"><section><header><Line size="short" /><span className="app-skeleton-control" /></header><span className="app-skeleton-chart" /></section><aside className="app-skeleton-dashboard-activity"><header><i className="app-skeleton-circle" /><div><Line size="short" /><Line size="medium" /></div></header>{Array.from({ length: 5 }, (_, item) => <span className="app-skeleton-activity-row" key={item}><i className="app-skeleton-circle" /><b><Line size="long" /><Line size="medium" /></b></span>)}</aside></div>
      : variant === "sales-analytics" ? <div className="app-skeleton-analytics"><section><header><div><Line size="short" /><Line size="medium" /></div><span className="app-skeleton-control" /></header><span className="app-skeleton-chart" /></section><aside><Line size="short" />{Array.from({ length: 5 }, (_, item) => <i key={item} />)}</aside><aside><Line size="short" />{Array.from({ length: 5 }, (_, item) => <i key={item} />)}</aside></div>
      : <section className="app-skeleton-panel"><header><div><Line size="short" /><Line size="long" /></div><span className="app-skeleton-button" /></header><TableRows columns={variant === "stock" || variant === "sales" || variant === "finance" ? 7 : 5} /></section>}
  </div>;
}
