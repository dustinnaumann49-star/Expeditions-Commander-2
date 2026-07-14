import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1>Expeditions-Commander</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setMode('login')} disabled={mode === 'login'}>
            Anmelden
          </button>
          <button type="button" onClick={() => setMode('register')} disabled={mode === 'register'}>
            Registrieren
          </button>
        </div>
        <input
          placeholder="Nutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={busy}>
          {mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
        </button>
      </form>
    </div>
  );
}
