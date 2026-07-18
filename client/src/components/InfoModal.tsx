import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// WICHTIG: alle Popups (InfoModal/LoreModal/DetailModal in Nachrichten.tsx) werden per Portal
// direkt in document.body gerendert, NICHT inline im normalen Seitenbaum. Grund: #mainbar hat
// `backdrop-filter` (siehe theme.css) - das erzeugt einen eigenen Stacking-Context, der jedes
// darin verschachtelte `position:fixed`-Element (also auch #combat-modal mit z-index:1000)
// gefangen haelt. Dadurch konnte die Ressourcenleiste (eigener z-index:10 auf oberster Ebene)
// trotz ihres NIEDRIGEREN z-index-Werts ueber dem Popup liegen und dessen oberen Rand verdecken -
// ein Stacking-Context "faengt" verschachtelte z-index-Werte ein, sie werden nie mit Geschwistern
// AUSSERHALB des Contexts verglichen. Ein Portal umgeht das komplett, ohne den
// backdrop-filter-Effekt auf #mainbar antasten zu muessen.
export function InfoModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return createPortal(
    <div id="combat-modal" style={{ display: 'flex' }} onClick={onClose}>
      <div id="modal-box" onClick={(e) => e.stopPropagation()}>
        <button id="modal-close" onClick={onClose}>
          ×
        </button>
        <h3 className="modal-title">{title}</h3>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function InfoTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="info-list">
      {rows.map(([label, value], i) => (
        <div className="info-list-row" key={i}>
          <span className="info-list-label">{label}</span>
          <span className="info-list-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
