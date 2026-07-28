import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ResourceBar } from './components/ResourceBar';
import { LoginPage } from './pages/Login';
import { WerftPage } from './pages/Werft';
import { SektorPage } from './pages/Sektor';
import { ForschungPage } from './pages/Forschung';
import { FlottePage } from './pages/Flotte';
import { HaendlerPage } from './pages/Haendler';
import { ShopPage } from './pages/Shop';
import { NachrichtenPage } from './pages/Nachrichten';
import { InventarPage } from './pages/Inventar';
import { MultiplayerPage } from './pages/Multiplayer';
import { GalaxiePage } from './pages/Galaxie';
import { UpdatesPage } from './pages/Updates';
import { StatistikPage } from './pages/Statistik';
import { KlassePage } from './pages/Klasse';
import { useGame } from './context/GameContext';

const NAV_ITEMS = [
  { to: '/', label: 'Schiffswerft' },
  { to: '/sektor', label: 'Sektor' },
  { to: '/forschung', label: 'Forschung' },
  { to: '/flotte', label: 'Flotte (Bestand)' },
  { to: '/haendler', label: 'Händler' },
  { to: '/shop', label: 'Shop' },
  { to: '/multiplayer', label: 'Multiplayer' },
  { to: '/galaxie', label: 'Galaxie' },
  { to: '/nachrichten', label: 'Nachrichten' },
  { to: '/inventar', label: 'Inventar' },
  { to: '/klasse', label: 'Klasse' },
  { to: '/statistik', label: 'Statistik' },
  { to: '/updates', label: 'Updates' },
];

// Zurueckgestuft auf EIN einziges, festes Hintergrundbild fuer die gesamte App (siehe README) -
// die vorherige Loesung mit unterschiedlichen Bildern pro Seite (per Route gewechselt) blieb
// trotz Vorlade-Fix und Komprimierung fehleranfaellig/inkonsistent. Deutlich simpler und
// robuster: das Bild wird EINMAL vom Browser geladen und danach nie wieder gewechselt, kein
// Aufblitzen, keine Route-abhaengige Logik mehr noetig. Wird direkt in theme.css gesetzt, kein
// JavaScript/CSS-Variable mehr dafuer erforderlich.

function Sidebar() {
  const location = useLocation();
  return (
    <div id="sidebar">
      {NAV_ITEMS.map((item) => (
        <Link key={item.to} to={item.to} className={`nav-btn${location.pathname === item.to ? ' active' : ''}`}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <>
      <ResourceBar />
      <div id="layout">
        <Sidebar />
        <div id="mainbar">
          <div key={location.pathname} className="page-transition">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

function GameHome() {
  const { state } = useGame();

  // Blockierende Erstwahl: solange keine Klasse gewaehlt ist (neu registrierte Spieler direkt
  // nach dem ersten Login, oder Bestandsspieler nach der Einfuehrung des Klassensystems - siehe
  // Migration in state.ts), ist der Rest des Spiels nicht erreichbar. Bewusst OHNE Sidebar/
  // ResourceBar, damit keine anderen Aktionen moeglich sind, bevor die Wahl getroffen wurde.
  if (state && state.playerClass === null) {
    return (
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px' }}>
        <KlassePage mandatory />
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<WerftPage />} />
        <Route path="/sektor" element={<SektorPage />} />
        <Route path="/forschung" element={<ForschungPage />} />
        <Route path="/flotte" element={<FlottePage />} />
        <Route path="/haendler" element={<HaendlerPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/multiplayer" element={<MultiplayerPage />} />
        <Route path="/galaxie" element={<GalaxiePage />} />
        <Route path="/nachrichten" element={<NachrichtenPage />} />
        <Route path="/inventar" element={<InventarPage />} />
        <Route path="/klasse" element={<KlassePage />} />
        <Route path="/statistik" element={<StatistikPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <GameProvider>
                  <GameHome />
                </GameProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
