import { useEffect } from 'react';
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
import { GalaxiePage } from './pages/Galaxie';
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
  { to: '/galaxie', label: 'Galaxie' },
  { to: '/nachrichten', label: 'Nachrichten' },
  { to: '/inventar', label: 'Inventar' },
  { to: '/statistik', label: 'Statistik' },
  { to: '/updates', label: 'Updates' },
];

// Seitenspezifisches Hintergrundbild pro Route (siehe theme.css `--page-bg`) - jede Seite kann so
// ihr eigenes thematisches Bild bekommen (Werft -> Werft-Halle, Forschung -> Labor, usw.), statt
// ueberall dasselbe Hauptbild zu zeigen. Fehlt fuer eine Route ein eigener Eintrag, greift der
// Fallback auf hauptbild.png (siehe usePageBackground() unten) - noch nicht jede Seite hat schon
// ein eigenes Bild, wird nach und nach ergaenzt, sobald neue Bilder geliefert werden.
const PAGE_BACKGROUNDS: Record<string, string> = {
  '/': 'werft.jpg',
  '/verteidigung': 'werft.jpg',
  '/sektor': 'sektor.jpg',
  '/forschung': 'forschung.jpg',
  '/flotte': 'flotte.jpg',
  '/haendler': 'haendler.jpg',
  '/multiplayer': 'multiplayer.jpg',
  '/galaxie': 'galaxie.jpg',
  // Shop, Nachrichten, Inventar, Statistik, Updates: noch KEIN eigenes Bild geliefert - bewusst
  // NICHT eingetragen, damit der Fallback auf hauptbild.jpg unten tatsaechlich greift. Waere
  // hier trotzdem ein Dateiname eingetragen, wuerde der Browser eine nicht existierende Datei
  // anfragen (404) UND der Fallback wuerde NICHT greifen (er wirkt nur, wenn die Route komplett
  // fehlt, nicht wenn die verlinkte Datei fehlt) - genau das ist vorher passiert.
};
const DEFAULT_BACKGROUND = 'hauptbild.jpg';

// Merkt sich, welche Hintergrundbild-URLs bereits erfolgreich geladen wurden (Modul-Ebene, nicht
// Komponenten-State - bleibt ueber die gesamte Sitzung/alle Seitenwechsel hinweg erhalten).
const preloadedBackgrounds = new Set<string>();

// Setzt die CSS-Variable --page-bg auf body, sobald sich die Route aendert. WICHTIG: schaltet
// NICHT sofort auf das neue Bild um, sondern laedt es erst im Hintergrund vor (per unsichtbarem
// Image()-Objekt) - das ALTE Bild bleibt waehrenddessen sichtbar. Ohne das wuerde bei jedem
// Seitenwechsel kurz eine weisse/leere Flaeche aufblitzen, bis das neue Bild ueber's Netz
// nachgeladen ist (besonders auf mobilen Verbindungen spuerbar). Bereits geladene Bilder werden
// gemerkt (siehe preloadedBackgrounds) und beim naechsten Besuch derselben Seite sofort ohne
// erneutes Nachladen angezeigt - der Browser haelt das Bild ohnehin im HTTP-Cache, `preloadedBackgrounds`
// spart nur den kurzen Umweg ueber ein neues Image()-Objekt.
function usePageBackground(pathname: string) {
  useEffect(() => {
    const file = PAGE_BACKGROUNDS[pathname] || DEFAULT_BACKGROUND;
    const url = `/background/${file}`;
    const apply = () => document.body.style.setProperty('--page-bg', `url('${url}')`);

    if (preloadedBackgrounds.has(url)) {
      apply();
      return;
    }
    const img = new Image();
    img.onload = () => {
      preloadedBackgrounds.add(url);
      apply();
    };
    img.onerror = () => {
      // Bild fehlt/fehlerhaft - trotzdem als "erledigt" markieren, damit nicht bei jedem
      // Routenwechsel erneut (erfolglos) nachgeladen wird.
      preloadedBackgrounds.add(url);
      apply();
    };
    img.src = url;
  }, [pathname]);
}

// Laedt beim allerersten App-Start ALLE bekannten Hintergrundbilder einmal im Hintergrund vor
// (unabhaengig davon, welche Seite gerade aktiv ist) - dadurch ist nach kurzer Zeit jeder
// Seitenwechsel sofort ohne Nachladen, auch beim ALLERERSTEN Besuch einer Seite.
function usePreloadAllBackgrounds() {
  useEffect(() => {
    const files = new Set([DEFAULT_BACKGROUND, ...Object.values(PAGE_BACKGROUNDS)]);
    files.forEach((file) => {
      const url = `/background/${file}`;
      if (preloadedBackgrounds.has(url)) return;
      const img = new Image();
      img.onload = () => preloadedBackgrounds.add(url);
      img.onerror = () => preloadedBackgrounds.add(url);
      img.src = url;
    });
  }, []);
}

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
  usePreloadAllBackgrounds();
  usePageBackground(location.pathname);
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
        <Route path="/galaxie" element={<GalaxiePage />} />
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
