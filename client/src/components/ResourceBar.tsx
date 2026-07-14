import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

export function ResourceBar() {
  const { state } = useGame();
  const { username, logout } = useAuth();
  if (!state) return null;

  const fmt = (n: number) => Math.floor(n).toLocaleString('de-DE');

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: '#1c1c1c', borderBottom: '1px solid #3a3a3a' }}>
      <div style={{ display: 'flex', gap: 20 }}>
        <span>Metall: {fmt(state.resources.metall)}</span>
        <span>Kristall: {fmt(state.resources.kristall)}</span>
        <span>Deuterium: {fmt(state.resources.deuterium)}</span>
        <span>Dunkle Materie: {fmt(state.resources.dm)}</span>
      </div>
      <div>
        <span style={{ marginRight: 12 }}>{username}</span>
        <button onClick={logout}>Abmelden</button>
      </div>
    </div>
  );
}
