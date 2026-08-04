import { useEffect, useRef, useState } from 'react';
import type { StatBonusLine } from '../lib/combatInfo';

// Einheitliche "Basiswert (Effektivwert)"-Anzeige mit Icon + farblicher Kennzeichnung je Stat-Typ
// (siehe .stat-waffen/-schild/-panzerung/-effective in theme.css) - ersetzt die vorher an drei
// Stellen (ShipBuildCard/DefenseBuildCard/Spezialschiffe) fast identisch duplizierte
// statDisplay()-Funktion. Effektivwert wird nur angezeigt, wenn er vom Basiswert abweicht.
// `breakdown` (Nutzerentscheidung 04.08.2026): optionale Liste der einzelnen Boni (Forschung/
// Klasse/Modul/Kampf-Booster), die den Effektivwert zusammensetzen - per Hover (Desktop) oder Tap
// (Mobil, kein Hover verfuegbar) auf den gruenen Effektivwert einsehbar.
export function StatValue({
  label,
  icon,
  base,
  effective,
  colorClass,
  breakdown,
}: {
  label: string;
  icon: string;
  base: number;
  effective: number;
  colorClass: string;
  breakdown?: StatBonusLine[];
}) {
  const rounded = Math.round(effective);
  const hasBreakdown = rounded !== base && !!breakdown && breakdown.length > 0;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  // Schliesst das Popover bei Tap/Klick ausserhalb - noetig fuer Mobil, da dort kein
  // MouseLeave-Event zum automatischen Schliessen existiert.
  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, [open]);

  return (
    <span>
      <span aria-hidden="true">{icon}</span> {label && `${label}: `}
      <span className={colorClass}>{base.toLocaleString('de-DE')}</span>
      {rounded !== base && (
        <span
          ref={wrapRef}
          className="stat-effective"
          style={{ position: 'relative', cursor: hasBreakdown ? 'help' : undefined }}
          onMouseEnter={() => hasBreakdown && setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={(e) => {
            if (!hasBreakdown) return;
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          {' '}
          ({rounded.toLocaleString('de-DE')})
          {hasBreakdown && open && (
            <span className="stat-breakdown-popover">
              {breakdown!.map((line, i) => (
                <span className="stat-breakdown-row" key={i}>
                  <span>{line.label}</span>
                  <span className="stat-breakdown-percent">{line.percent}</span>
                </span>
              ))}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
