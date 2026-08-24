export function AuthLandingBackdrop({ section }: { section: string }) {
  return <div className="auth-landing-backdrop" data-section={section} aria-hidden="true">
    <div className="auth-landing-fallback" />
  </div>;
}
