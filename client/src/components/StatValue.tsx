// Einheitliche "Basiswert (Effektivwert)"-Anzeige mit Icon + farblicher Kennzeichnung je Stat-Typ
// (siehe .stat-waffen/-schild/-panzerung/-effective in theme.css) - ersetzt die vorher an drei
// Stellen (ShipBuildCard/DefenseBuildCard/Spezialschiffe) fast identisch duplizierte
// statDisplay()-Funktion. Effektivwert wird nur angezeigt, wenn er vom Basiswert abweicht.
export function StatValue({
  label,
  icon,
  base,
  effective,
  colorClass,
}: {
  label: string;
  icon: string;
  base: number;
  effective: number;
  colorClass: string;
}) {
  const rounded = Math.round(effective);
  return (
    <span>
      <span aria-hidden="true">{icon}</span> {label && `${label}: `}
      <span className={colorClass}>{base.toLocaleString('de-DE')}</span>
      {rounded !== base && <span className="stat-effective"> ({rounded.toLocaleString('de-DE')})</span>}
    </span>
  );
}
