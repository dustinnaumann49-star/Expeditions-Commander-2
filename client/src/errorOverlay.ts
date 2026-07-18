// Zeigt Laufzeitfehler direkt sichtbar auf der Seite an, statt dass die App stillschweigend
// verschwindet - wichtig fuer Nutzer ohne Zugriff auf die Browser-Entwicklertools (z.B. mobil
// ueber Samsung DEX). Deckt Fehler ab, die AUSSERHALB von Reacts Render-Zyklus auftreten
// (Event-Handler, Promises/async-Code, Fehler vor dem ersten Rendern) - fuer Fehler WAEHREND des
// Renderns siehe stattdessen components/ErrorBoundary.tsx.
export function showErrorOverlay(title: string, message: string): void {
  if (document.getElementById('global-error-overlay')) return; // nur den ERSTEN Fehler anzeigen
  const div = document.createElement('div');
  div.id = 'global-error-overlay';
  div.style.cssText =
    'position:fixed;inset:0;background:#1a0000;color:#ff9090;padding:20px;z-index:999999;overflow:auto;font-family:monospace;font-size:13px;white-space:pre-wrap;';
  const heading = document.createElement('h2');
  heading.style.cssText = 'color:#ff4444;margin-bottom:12px;font-size:16px;';
  heading.textContent = '⚠ ' + title;
  const body = document.createElement('div');
  body.textContent = message; // textContent statt innerHTML - kein XSS-Risiko durch Fehlertexte
  div.appendChild(heading);
  div.appendChild(body);
  document.body.appendChild(div);
}
