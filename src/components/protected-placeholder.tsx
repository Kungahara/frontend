type ProtectedPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ProtectedPlaceholder({
  eyebrow,
  title,
  description,
}: ProtectedPlaceholderProps) {
  return (
    <section className="placeholder" aria-labelledby="placeholder-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="placeholder-title">{title}</h1>
      <p>{description}</p>
      <div className="placeholder-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
