// @ts-nocheck
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Declare global types
declare global {
  interface Window {
    deferredPrompt: any;
    isPwaInstalled: boolean;
  }
}

// Global PWA triggers & events
window.deferredPrompt = null;
window.isPwaInstalled = window.matchMedia('(display-mode: standalone)').matches;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  window.deferredPrompt = e;
  console.log('[PWA] captured beforeinstallprompt event.');
  // Dispatch custom event to let components render an "Install" button
  window.dispatchEvent(new CustomEvent('pwa-install-prompt-available'));
});

window.addEventListener('appinstalled', () => {
  window.isPwaInstalled = true;
  window.deferredPrompt = null;
  console.log('[PWA] Application successfully installed on desktop/mobile!');
  window.dispatchEvent(new CustomEvent('pwa-installed-status-changed'));
});

// Register PWA service worker for complete offline-first support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
      });
  });
}

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) { 
    super(props); 
    this.state = { hasError: false, error: null }; 
  }
  static getDerivedStateFromError(error: Error) { 
    return { hasError: true, error }; 
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) { 
    console.error("Error caught:", error, info); 
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '20px', color: 'red', fontFamily: 'sans-serif'}}>
          <h1>Something went wrong.</h1>
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error)}</pre>
          <pre style={{whiteSpace:'pre-wrap', fontSize:'12px', marginTop:'10px'}}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
