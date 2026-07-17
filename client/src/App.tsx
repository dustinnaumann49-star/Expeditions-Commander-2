import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ResourceBar } from './components/ResourceBar';
import { LoginPage } from './pages/Login';
import { WerftPage } from './pages/Werft';
import { VerteidigungPage } from './pages/Verteidigung';
import { SektorPage } from './pages/Sektor';
import { ForschungPage } from './pages/Forschung';
import { FlottePage } from './pages/Flotte';
import { HaendlerPage } from './pages/Haendler';
import { ShopPage } from './pages/Shop';
import { NachrichtenPage } from './pages/Nachrichten';
import { InventarPage } from './pages/Inventar';
import { MultiplayerPage } from './pages/Multiplayer';
import { UpdatesPage } from './pages/Updates';
import { StatistikPage } from './pages/Statistik';

const NAV_ITEMS = [
  { to: '/', label: 'Schiffswerft' },
  { to: '/verteidigung', label: 'Verteidigung' },
  { to: '/sektor', label: 'Sektor' },
  { to: '/forschung', label: 'Forschung' },
  { to: '/flotte', label: 'Flotte (Bestand)' },
  { to: '/haendler', label: 'Händler' },
  { to: '/shop', label: 'Shop' },
  { to: '/multiplayer', label: 'Multiplayer' },
  { to: '/nachrichten', label: 'Nachrichten' },
  { to: '/inventar', label: 'Inventar' },
  { to: '/statistik', label: 'Statistik' },
  { to: '/updates', label: 'Updates' },
];

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
  return (
    <>
      <ResourceBar />
      <div id="layout">
        <Sidebar />
        <div id="mainbar">{children}</div>
      </div>
    </>
  );
}

function GameHome() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<WerftPage />} />
        <Route path="/verteidigung" element={<VerteidigungPage />} />
        <Route path="/sektor" element={<SektorPage />} />
        <Route path="/forschung" element={<ForschungPage />} />
        <Route path="/flotte" element={<FlottePage />} />
        <Route path="/haendler" element={<HaendlerPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/multiplayer" element={<MultiplayerPage />} />
        <Route path="/nachrichten" element={<NachrichtenPage />} />
        <Route path="/inventar" element={<InventarPage />} />
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
