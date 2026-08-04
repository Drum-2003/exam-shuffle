export function PageLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className="loading-shell">
      <section className="loading-panel">
        <div className="loading-brand skeleton-block" />
        <div className="loading-title skeleton-block" />
        <div className="loading-copy skeleton-block" />
        <div className="loading-copy loading-copy--short skeleton-block" />

        <div className="loading-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="loading-card" key={index}>
              <div className="loading-icon skeleton-block" />
              <div className="loading-line skeleton-block" />
              <div className="loading-number skeleton-block" />
            </div>
          ))}
        </div>

        <div className="loading-table">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="loading-row" key={index}>
              <div className="skeleton-block" />
              <div className="skeleton-block" />
              <div className="skeleton-block" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
