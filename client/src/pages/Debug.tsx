import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { api } from '../api/client';
import type { DebugBotState, DebugPirateBaseState, GameData } from '../types/game';

// Reines Beobachtungs-Werkzeug (Nutzerentscheidung Juli 2026: "wie pruefe ich am besten, ob sich
// Bots/Piratenbasen so verhalten wie gedacht") - zeigt den vollen Zustand von KI-Vega/KI-Nyx und
// den aktiven Piratenbasen, damit man Wirtschafts-/Angriffsverhalten ueber die Zeit beobachten
// kann. Unbedenklich in einem 2-Spieler-Koop-Spiel unter vertrauten Mitspielern (kein PvP).

function nonZeroEntries(rec: Record<string, number>): [string, number][] {
  return Object.entries(rec).filter(([, v]) => v > 0);
}

interface EntityCardState {
  playerClass: string | null;
  resources: { metall: number; kristall: number; deuterium: number; dm: number };
  fleet: Record<string, number>;
  defense: Record<string, number>;
  buildings: Record<string, number>;
  research: Record<string, number>;
}

// AUSSERHALB von DebugPage definiert (Bugfix Juli 2026: als verschachtelte Funktion drin bekam
// diese Komponente bei JEDEM Rendern von DebugPage - u.a. alle 3s durch das globale State-Polling
// in GameContext.tsx - eine neue Funktionsreferenz. React hat sie deshalb bei jedem Poll komplett
// neu gemountet statt nur aktualisiert, was die queue-box-Eintritts-Animation (fadeInUp) staendig
// erneut ausgeloest hat - sichtbares Flackern. Mit stabiler Referenz hier oben rendert React nur
// noch die tatsaechlich geaenderten Werte, kein Re-Mount mehr.
function EntityCard({
  title,
  subtitle,
  state,
  gameData,
}: {
  title: string;
  subtitle?: string;
  state: EntityCardState;
  gameData: GameData;
}) {
  const shipName = (id: string) => gameData.ships.find((s) => s.id === id)?.name || id;
  const defenseName = (id: string) => gameData.defenses.find((d) => d.id === id)?.name || id;
  const buildingName = (id: string) => gameData.buildings.find((b) => b.id === id)?.name || id;
  const researchName = (id: string) => gameData.research.find((r) => r.id === id)?.name || id;

  return (
    <div className="queue-box" style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, marginBottom: 4 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>{subtitle}</p>}
      <p style={{ fontSize: 13, marginBottom: 10 }}>
        Klasse: <strong>{state.playerClass || '–'}</strong> · Metall{' '}
        <strong>{Math.round(state.resources.metall).toLocaleString('de-DE')}</strong> · Kristall{' '}
        <strong>{Math.round(state.resources.kristall).toLocaleString('de-DE')}</strong> · Deuterium{' '}
        <strong>{Math.round(state.resources.deuterium).toLocaleString('de-DE')}</strong> · DM{' '}
        <strong>{Math.round(state.resources.dm).toLocaleString('de-DE')}</strong>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>🚀 Flotte</p>
          {nonZeroEntries(state.fleet).length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Keine Schiffe.</p>
          ) : (
            nonZeroEntries(state.fleet).map(([id, qty]) => (
              <p key={id} style={{ fontSize: 12 }}>
                {shipName(id)}: <strong>{qty.toLocaleString('de-DE')}</strong>
              </p>
            ))
          )}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>🏰 Verteidigung</p>
          {nonZeroEntries(state.defense).length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Keine Verteidigung.</p>
          ) : (
            nonZeroEntries(state.defense).map(([id, qty]) => (
              <p key={id} style={{ fontSize: 12 }}>
                {defenseName(id)}: <strong>{qty.toLocaleString('de-DE')}</strong>
              </p>
            ))
          )}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>🏗️ Gebäude</p>
          {nonZeroEntries(state.buildings).length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Keine Gebäude.</p>
          ) : (
            nonZeroEntries(state.buildings).map(([id, lvl]) => (
              <p key={id} style={{ fontSize: 12 }}>
                {buildingName(id)}: Stufe <strong>{lvl}</strong>
              </p>
            ))
          )}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>🔬 Forschung</p>
          {nonZeroEntries(state.research).length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Keine Forschung.</p>
          ) : (
            nonZeroEntries(state.research).map(([id, lvl]) => (
              <p key={id} style={{ fontSize: 12 }}>
                {researchName(id)}: Stufe <strong>{lvl}</strong>
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function DebugPage() {
  const { gameData } = useGame();
  const [bots, setBots] = useState<DebugBotState[] | null>(null);
  const [pirateBases, setPirateBases] = useState<DebugPirateBaseState[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await api.getDebugNpcs();
      setBots(res.bots);
      setPirateBases(res.pirateBases);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!gameData) return <PageSkeleton />;

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Debug: Bots &amp; Piratenbasen</h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        Reines Beobachtungs-Werkzeug - zeigt den vollen, aktuellen Zustand der KI-Mitspieler und der aktiven Piratenbasen, um ihr
        Wirtschafts-/Angriffsverhalten nachzuvollziehen.
      </p>
      <button className="qty-btn" onClick={refresh} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? 'Lädt…' : 'Neu laden'}
      </button>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {bots && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>🤖 KI-Mitspieler</h3>
          {bots.map((b) => (
            <EntityCard
              key={b.username}
              title={`🤖 ${b.username}`}
              subtitle={`Position: ${b.galaxyPosition ? `1:${b.galaxyPosition.system}:${b.galaxyPosition.position}` : '–'} · Bau-/Forschungswarteschlangen: ${
                b.buildQueueLength
              } Schiffe, ${b.defenseQueueLength} Verteidigung, ${b.buildingQueueLength} Gebäude, ${b.researchQueueLength} Forschung`}
              state={b}
              gameData={gameData}
            />
          ))}
        </>
      )}

      {pirateBases && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 10, marginTop: 8 }}>🏴‍☠️ Piratenbasen</h3>
          {pirateBases.map((p) => (
            <EntityCard
              key={p.id}
              title={`🏴‍☠️ Piratenbasis 1:${p.system}:${p.position}`}
              subtitle={`Angriffsflüge unterwegs: ${p.outgoingAttacks}`}
              state={p}
              gameData={gameData}
            />
          ))}
        </>
      )}
    </div>
  );
}
