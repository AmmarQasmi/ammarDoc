export default function GlobalLoading() {
  return (
    <div className="global-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="global-loader-card">
        <span className="loader-dot" />
        <p>Loading AQ Doc...</p>
      </div>
    </div>
  );
}
