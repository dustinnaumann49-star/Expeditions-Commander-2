// Hält die Differenz zwischen Server- und Client-Uhr fest, damit alle Countdown-Anzeigen im
// Frontend auf der (immer korrekten) Serverzeit basieren statt auf der möglicherweise falsch
// eingestellten Uhr des Browsers. Wird bei jeder Server-Antwort aktualisiert (siehe GameContext).
let offsetMs = 0;

export function updateServerTimeOffset(serverTime: number) {
  offsetMs = serverTime - Date.now();
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}
