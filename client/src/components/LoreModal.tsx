import { createPortal } from 'react-dom';
import type { GameData } from '../types/game';

interface LoreTarget {
  kind: 'ship' | 'defense' | 'research' | 'building';
  id: string;
}

export function LoreModal({ target, gameData, onClose }: { target: LoreTarget | null; gameData: GameData; onClose: () => void }) {
  if (!target) return null;
  const list =
    target.kind === 'ship' ? gameData.ships : target.kind === 'defense' ? gameData.defenses : target.kind === 'building' ? gameData.buildings : gameData.research;
  const entry = list.find((e) => e.id === target.id);
  if (!entry) return null;

  // Per Portal gerendert - siehe Kommentar in InfoModal.tsx (Stacking-Context-Falle durch
  // backdrop-filter auf #mainbar, sonst von der Ressourcenleiste teilweise verdeckt).
  return createPortal(
    <div id="combat-modal" style={{ display: 'flex' }} onClick={onClose}>
      <div id="modal-box" onClick={(e) => e.stopPropagation()}>
        <button id="modal-close" onClick={onClose}>
          ×
        </button>
        <h3 className="modal-title">{entry.name}</h3>
        <img
          src={`/${entry.img}`}
          style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 12 }}
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          alt={entry.name}
        />
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>
          {entry.lore || 'Zu diesem Eintrag ist noch keine Geschichte bekannt.'}
        </p>
      </div>
    </div>,
    document.body
  );
}
