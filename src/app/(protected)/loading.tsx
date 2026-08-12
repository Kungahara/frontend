export default function ProtectedLoading() {
  return <div className="route-loading-screen route-loading-fallback" role="status" aria-live="polite">
    <span className="route-loading-spinner" aria-hidden="true" />
    <strong>Loading page…</strong>
    <small>Please wait a moment.</small>
  </div>;
}
