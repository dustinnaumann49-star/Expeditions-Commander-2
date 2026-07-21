// Ersetzt den vorherigen reinen "Lade..."-Text waehrend der Erstladung (gameData/state noch
// null) - generische Platzhalter-Bloecke, passen zum Karten-/Queue-Box-Look jeder Seite, egal
// welches konkrete Layout gleich danach einrastet.
export function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton-block" style={{ height: 26, width: '35%' }} />
      <div className="skeleton-block" style={{ height: 90 }} />
      <div className="skeleton-block" style={{ height: 90 }} />
      <div className="skeleton-block" style={{ height: 90, width: '70%' }} />
    </div>
  );
}
