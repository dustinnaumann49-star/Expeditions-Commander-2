import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { StatBonusLine } from '../lib/combatInfo';

// Einheitliche "Basiswert (Effektivwert)"-Anzeige mit Icon + farblicher Kennzeichnung je Stat-Typ
// (siehe .stat-waffen/-schild/-panzerung/-effective in theme.css) - ersetzt die vorher an drei
// Stellen (ShipBuildCard/DefenseBuildCard/Spezialschiffe) fast identisch duplizierte
// statDisplay()-Funktion. Effektivwert wird nur angezeigt, wenn er vom Basiswert abweicht.
// `breakdown` (Nutzerentscheidung 04.08.2026): optionale Liste der einzelnen Boni (Forschung/
// Klasse/Modul/Kampf-Booster), die den Effektivwert zusammensetzen - per Hover (Desktop) oder Tap
// (Mobil, kein Hover verfuegbar) auf den gruenen Effektivwert einsehbar. Das Popover wird per
// React-Portal direkt in <body> gerendert (Bugfix 04.08.2026, Nutzer-Fund: "verschwindet bei
// Panzerung") - `.ship-card` hat `overflow:hidden` (noetig fuer die abgerundeten Bild-Ecken/den
// Hover-Zoom-Effekt), das schnitt das vorher als normales Kind-Element positionierte Popover bei
// weiter rechts stehenden Stats (Panzerung ist ueblicherweise der dritte/rechte Wert der Zeile) ab,
// da es dort ueber den rechten Kartenrand hinausragte. Ueber ein Portal ist es davon unabhaengig.
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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  // Kleine Verzoegerung statt sofortigem Schliessen (Nutzerentscheidung) - sonst schliesst sich das
  // Popover schon beim Ueberqueren der wenigen Pixel Luecke zwischen Trigger-Text und Popover
  // darunter, bevor die Maus dort ankommt.
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popoverWidth = 220;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - popoverWidth / 2, window.innerWidth - popoverWidth - 8));
    setPos({ top: rect.bottom + 6, left });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  return (
    <span>
      <span aria-hidden="true">{icon}</span> {label && `${label}: `}
      <span className={colorClass}>{base.toLocaleString('de-DE')}</span>
      {rounded !== base && (
        <span
          ref={triggerRef}
          className="stat-effective"
          style={{ cursor: hasBreakdown ? 'help' : undefined }}
          onMouseEnter={() => {
            if (!hasBreakdown) return;
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={() => hasBreakdown && scheduleClose()}
          onClick={(e) => {
            if (!hasBreakdown) return;
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          {' '}
          ({rounded.toLocaleString('de-DE')})
        </span>
      )}
      {hasBreakdown &&
        open &&
        pos &&
        createPortal(
          <span
            ref={popoverRef}
            className="stat-breakdown-popover"
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            {breakdown!.map((line, i) => (
              <span className="stat-breakdown-row" key={i}>
                <span>{line.label}</span>
                <span className="stat-breakdown-percent">{line.percent}</span>
              </span>
            ))}
          </span>,
          document.body
        )}
    </span>
  );
}
