import type { ReactNode } from 'react';

export function InfoModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div id="combat-modal" style={{ display: 'flex' }} onClick={onClose}>
      <div id="modal-box" onClick={(e) => e.stopPropagation()}>
        <button id="modal-close" onClick={onClose}>
          ×
        </button>
        <h3 className="modal-title">{title}</h3>
        {children}
      </div>
    </div>
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
