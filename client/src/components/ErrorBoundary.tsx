import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

// Faengt Fehler waehrend des Renderns ab und zeigt sie sichtbar an, statt dass die App einfach
// verschwindet (weisser/leerer Bildschirm) - wichtig fuer Nutzer ohne Zugriff auf die Browser-
// Entwicklertools. Fuer Fehler AUSSERHALB des Render-Zyklus (Promises, Event-Handler) siehe
// stattdessen errorOverlay.ts (wird in main.tsx global registriert).
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ error, componentStack: info.componentStack ?? null });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#1a0000',
            color: '#ff9090',
            padding: 20,
            zIndex: 999999,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        >
          <h2 style={{ color: '#ff4444', marginBottom: 12, fontSize: 16 }}>⚠ Fehler in der App</h2>
          <p style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{this.state.error.message}</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, opacity: 0.8 }}>{this.state.error.stack}</pre>
          {this.state.componentStack && (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, opacity: 0.6, marginTop: 12 }}>{this.state.componentStack}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
