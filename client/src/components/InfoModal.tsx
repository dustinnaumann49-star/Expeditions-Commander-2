import type { ReactNode } from 'react';

export function InfoModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div id="combat-modal" style={{ display: 'flex' }} onClick={onClose}>
      <div id="modal-box" onClick={(e) => e.stopPropagation()}>
        <button id="modal-close" onClick={onClose}>
          ×
        </button>
        <h3 style={{ marginBottom: 12 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function InfoTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <table className="combat-table" style={{ marginBottom: 16 }}>
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i}>
            <td style={{ textAlign: 'left', width: '45%' }}>{label}</td>
            <td style={{ textAlign: 'left' }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
