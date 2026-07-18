import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './theme.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { showErrorOverlay } from './errorOverlay';

// Fehler AUSSERHALB von Reacts Render-Zyklus (Event-Handler, Promises/async-Code) sichtbar
// machen, statt dass die App stillschweigend verschwindet - wichtig fuer Nutzer ohne Zugriff auf
// die Browser-Entwicklertools (z.B. mobil ueber Samsung DEX). Fuer Fehler WAEHREND des Renderns
// siehe stattdessen die ErrorBoundary weiter unten.
window.addEventListener('error', (event) => {
  showErrorOverlay('JavaScript-Fehler', `${event.message}\n\n${event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`}`);
});
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  showErrorOverlay('Unbehandelter Promise-Fehler', reason?.stack || String(reason));
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
